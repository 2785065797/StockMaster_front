<template>
  <AppHeader :title="'StockMaster'" />
  <div class="orders-container">
    <header class="orders-header">
      <div class="header-left">
        <h1>采购订单管理</h1>
        <p class="sub">管理向供应商订购但尚未到货的商品</p>
      </div>
      <div class="header-right">
        <button class="btn primary" @click="openNewOrder">新建订单</button>
      </div>
    </header>

    <section class="controls">
      <input v-model="searchQuery" placeholder="搜索订单号 / 供应商" class="input" />
      <select v-model="filterSupplier" class="select">
        <option value="">全部供应商</option>
        <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model="filterStatus" class="select">
        <option value="">全部状态</option>
        <option value="Pending">未到货</option>
        <option value="Received">已到货</option>
        <option value="Cancelled">已取消</option>
      </select>
    </section>

    <section class="orders-table">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>供应商</th>
            <th>下单日期</th>
            <th>预计到货</th>
            <th>商品数</th>
            <th>总价</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ getSupplierName(order.supplierId) }}</td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>{{ order.expectedAt ? formatDate(order.expectedAt) : '-' }}</td>
            <td>{{ order.items.length }}</td>
            <td>{{ formatCurrency(order.total) }}</td>
            <td>
              <span :class="['status', order.status.toLowerCase()]">{{
                statusLabel(order.status)
              }}</span>
            </td>
            <td class="actions">
              <button class="btn small" @click="viewOrder(order)">查看</button>
              <button
                class="btn small success"
                @click="markReceived(order)"
                :disabled="order.status !== 'Pending'"
              >
                标记到货
              </button>
              <button
                class="btn small danger"
                @click="cancelOrder(order)"
                :disabled="order.status !== 'Pending'"
              >
                取消
              </button>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="8" class="empty">暂无符合条件的订单</td>
          </tr>
        </tbody>
      </table>
    </section>

    <footer class="pagination">
      <div class="info">共 {{ filteredOrders.length }} 条，页码 {{ page }} / {{ totalPages }}</div>
      <div class="controls">
        <button class="btn" @click="prevPage" :disabled="page === 1">上一页</button>
        <button class="btn" @click="nextPage" :disabled="page === totalPages">下一页</button>
        <select v-model.number="pageSize" class="select small">
          <option :value="5">5 / 页</option>
          <option :value="10">10 / 页</option>
          <option :value="20">20 / 页</option>
        </select>
      </div>
    </footer>

    <!-- New Order Modal -->
    <div class="modal-backdrop" v-if="showNewOrder">
      <div class="modal">
        <h2>新建采购订单</h2>
        <div class="form-row">
          <label>供应商</label>
          <select v-model="newOrder.supplierId" class="select">
            <option value="">请选择供应商</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="form-row">
          <label>预计到货日期</label>
          <input type="date" v-model="newOrder.expectedAt" class="input" />
        </div>

        <div class="items-section">
          <h3>商品明细</h3>
          <div v-for="(it, idx) in newOrder.items" :key="idx" class="item-row">
            <input v-model="it.name" placeholder="商品名称" class="input name" />
            <input type="number" min="1" v-model.number="it.qty" class="input qty" />
            <input
              type="number"
              min="0"
              step="0.01"
              v-model.number="it.unitPrice"
              class="input price"
            />
            <button class="btn danger small" @click="removeItem(idx)">删除</button>
          </div>
          <button class="btn" @click="addItem">添加商品</button>
        </div>

        <div class="modal-actions">
          <button class="btn" @click="closeNewOrder">取消</button>
          <button class="btn primary" @click="createOrder" :disabled="!canCreate">确定下单</button>
        </div>
      </div>
    </div>

    <!-- View Order Drawer (simple) -->
    <div class="drawer" v-if="viewingOrder">
      <div class="drawer-content">
        <h3>订单详情：{{ viewingOrder.id }}</h3>
        <p><strong>供应商：</strong> {{ getSupplierName(viewingOrder.supplierId) }}</p>
        <p><strong>下单：</strong> {{ formatDate(viewingOrder.createdAt) }}</p>
        <p>
          <strong>预计到货：</strong>
          {{ viewingOrder.expectedAt ? formatDate(viewingOrder.expectedAt) : '-' }}
        </p>
        <p><strong>状态：</strong> {{ statusLabel(viewingOrder.status) }}</p>
        <h4>商品列表</h4>
        <ul>
          <li v-for="(it, idx) in viewingOrder.items" :key="idx">
            {{ it.name }} — 数量: {{ it.qty }} — 单价: {{ formatCurrency(it.unitPrice) }}
          </li>
        </ul>
        <p><strong>总价：</strong> {{ formatCurrency(viewingOrder.total) }}</p>
        <div class="drawer-actions">
          <button class="btn" @click="viewingOrder = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { ref, reactive, computed, onMounted, watch } from 'vue'

type OrderItem = {
  name: string
  qty: number
  unitPrice: number
}

type Order = {
  id: string
  supplierId: string
  createdAt: string
  expectedAt: string | null
  items: OrderItem[]
  total: number
  status: 'Pending' | 'Received' | 'Cancelled'
  receivedAt?: string | null
}

type Supplier = { id: string; name: string; contact?: string }

const suppliers = ref<Supplier[]>([
  { id: 's1', name: '上海食品有限公司' },
  { id: 's2', name: '广州冷链供应' },
  { id: 's3', name: '北京农产直供' },
])

const orders = ref<Order[]>([])

const generateId = () => 'PO' + Date.now().toString().slice(-6)

const nowISO = (d = new Date()) => d.toISOString().slice(0, 10)

const seedOrders = () => {
  orders.value = [
    {
      id: 'PO1001',
      supplierId: 's1',
      createdAt: '2025-12-10',
      expectedAt: '2025-12-15',
      items: [
        { name: '牛奶', qty: 50, unitPrice: 3.5 },
        { name: '面包', qty: 100, unitPrice: 1.2 },
      ],
      total: 50 * 3.5 + 100 * 1.2,
      status: 'Pending',
    },
    {
      id: 'PO1002',
      supplierId: 's2',
      createdAt: '2025-12-08',
      expectedAt: null,
      items: [{ name: '冷冻披萨', qty: 30, unitPrice: 12.0 }],
      total: 30 * 12.0,
      status: 'Received',
      receivedAt: '2025-12-12',
    },
    {
      id: 'PO1003',
      supplierId: 's3',
      createdAt: '2025-12-11',
      expectedAt: '2025-12-20',
      items: [{ name: '苹果', qty: 200, unitPrice: 0.8 }],
      total: 200 * 0.8,
      status: 'Pending',
    },
  ]
}

onMounted(() => {
  seedOrders()
})

const searchQuery = ref('')
const filterSupplier = ref<string | ''>('')
const filterStatus = ref<string | ''>('')

const filteredOrders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return orders.value
    .filter((o) => {
      if (filterSupplier.value && o.supplierId !== filterSupplier.value) return false
      if (filterStatus.value && o.status !== filterStatus.value) return false
      if (!q) return true
      return (
        o.id.toLowerCase().includes(q) || getSupplierName(o.supplierId).toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
})

/* pagination */
const page = ref(1)
const pageSize = ref(10)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredOrders.value.length / pageSize.value)),
)
const paginatedOrders = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredOrders.value.slice(start, start + pageSize.value)
})
const prevPage = () => {
  if (page.value > 1) page.value--
}
const nextPage = () => {
  if (page.value < totalPages.value) page.value++
}

watch([filteredOrders, pageSize], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})
/* new order modal */
const showNewOrder = ref(false)
const newOrder = reactive({
  supplierId: '',
  expectedAt: nowISO(),
  items: [] as OrderItem[],
})

const openNewOrder = () => {
  newOrder.supplierId = ''
  newOrder.expectedAt = nowISO()
  newOrder.items = []
  showNewOrder.value = true
}

const closeNewOrder = () => {
  showNewOrder.value = false
}

const addItem = () => {
  newOrder.items.push({ name: '', qty: 1, unitPrice: 0 })
}

const removeItem = (idx: number) => {
  newOrder.items.splice(idx, 1)
}

const canCreate = computed(() => {
  return (
    !!newOrder.supplierId &&
    newOrder.items.length > 0 &&
    newOrder.items.every((i) => i.name.trim() && i.qty > 0)
  )
})

const createOrder = () => {
  if (!canCreate.value) return
  const id = generateId()
  const total = newOrder.items.reduce((s, it) => s + it.qty * it.unitPrice, 0)
  const order: Order = {
    id,
    supplierId: newOrder.supplierId,
    createdAt: nowISO(),
    expectedAt: newOrder.expectedAt || null,
    items: newOrder.items.map((i) => ({ ...i })),
    total,
    status: 'Pending',
  }
  orders.value.unshift(order)
  showNewOrder.value = false
  // reset page to first to see new order
  page.value = 1
}

/* actions */
const markReceived = (order: Order) => {
  if (order.status !== 'Pending') return
  order.status = 'Received'
  order.receivedAt = nowISO()
}

const cancelOrder = (order: Order) => {
  if (order.status !== 'Pending') return
  order.status = 'Cancelled'
}

const viewingOrder = ref<Order | null>(null)
const viewOrder = (order: Order) => {
  viewingOrder.value = JSON.parse(JSON.stringify(order))
}

/* helpers */
const getSupplierName = (id: string) => suppliers.value.find((s) => s.id === id)?.name || id
const formatCurrency = (n: number) => `¥${n.toFixed(2)}`
const formatDate = (d: string | undefined | null) => (d ? d : '-')
const statusLabel = (s: Order['status']) =>
  s === 'Pending' ? '未到货' : s === 'Received' ? '已到货' : '已取消'
</script>

<style scoped>
.orders-container {
  max-width: 1100px;
  margin: 24px auto;
  font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
  padding: 0 12px;
}
.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.orders-header h1 {
  margin: 0;
  font-size: 1.4rem;
  color: #182848;
}
.sub {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}
.controls {
  display: flex;
  gap: 10px;
  margin: 12px 0 20px;
  align-items: center;
}
.input {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-width: 160px;
}
.select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.btn {
  background: #f0f0f0;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.btn.primary {
  background: #4b6cb7;
  color: #fff;
}
.btn.success {
  background: #4caf50;
  color: #fff;
}
.btn.danger {
  background: #e53935;
  color: #fff;
}
.btn.small {
  padding: 6px 8px;
  font-size: 0.85rem;
}
.select.small {
  padding: 6px 8px;
}

.orders-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
}
.orders-table th,
.orders-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #f2f2f2;
  font-size: 0.95rem;
}
.orders-table thead th {
  background: #fafbff;
  color: #182848;
}
.actions {
  display: flex;
  gap: 6px;
}

.status {
  padding: 6px 8px;
  border-radius: 6px;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
}
.status.pending {
  background: #ff9800;
}
.status.received {
  background: #4caf50;
}
.status.cancelled {
  background: #9e9e9e;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #888;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  gap: 10px;
}
.pagination .info {
  color: #666;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: white;
  padding: 18px;
  border-radius: 10px;
  width: 720px;
  max-width: 95%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.form-row label {
  min-width: 100px;
  color: #444;
}
.items-section h3 {
  margin: 10px 0;
}
.item-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.input.name {
  flex: 1;
}
.input.qty {
  width: 80px;
}
.input.price {
  width: 110px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
}
.drawer-content {
  margin-left: auto;
  width: 420px;
  background: white;
  height: 100%;
  padding: 18px;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
}
.drawer-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  .orders-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .modal {
    width: 95%;
  }
  .drawer {
    display: none;
  }
}
</style>
