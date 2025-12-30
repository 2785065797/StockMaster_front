<template>
  <AppHeader :title="'StockMaster'" />
  <div class="inventory-container">
    <header class="inventory-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">← 返回</button>
        <h1>库存管理</h1>
      </div>
      <div class="header-actions">
        <input v-model="query" class="search" placeholder="搜索商品名称或 SKU" />
        <button class="add-btn" @click="openAdd">新增商品</button>
      </div>
    </header>

    <section class="controls">
      <div class="stats">
        <div>
          总商品: <strong>{{ items.length }}</strong>
        </div>
        <div>
          低库存: <strong class="warning">{{ lowStockCount }}</strong>
        </div>
        <div>
          库存总值: <strong>{{ totalValue }}</strong>
        </div>
      </div>

      <div class="pagination-controls">
        <label>
          每页
          <select v-model.number="pageSize">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
          条
        </label>
      </div>
    </section>

    <table class="inventory-table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>商品名称</th>
          <th>供应商</th>
          <th>成本价</th>
          <th>库存</th>
          <th>状态</th>
          <th class="actions-col">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in pagedItems"
          :key="item.id"
          :class="{ low: item.quantity <= lowStockThreshold }"
        >
          <td>{{ item.sku }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.supplier }}</td>
          <td>{{ formatCurrency(item.cost) }}</td>
          <td>{{ item.quantity }}</td>
          <td>
            <span v-if="item.quantity <= lowStockThreshold" class="status low">低</span>
            <span v-else class="status ok">正常</span>
          </td>
          <td class="actions-col">
            <button class="small" @click="openEdit(item)">编辑</button>
            <button class="small danger" @click="confirmDelete(item)">删除</button>
          </td>
        </tr>
        <tr v-if="pagedItems.length === 0">
          <td colspan="7" class="empty">无匹配商品</td>
        </tr>
      </tbody>
    </table>

    <footer class="pager">
      <button :disabled="page === 1" @click="page--">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button :disabled="page === totalPages" @click="page++">下一页</button>
    </footer>

    <!-- Add / Edit Modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editMode ? '编辑商品' : '新增商品' }}</h3>
        <form @submit.prevent="saveItem">
          <label
            >SKU
            <input v-model.trim="form.sku" required />
          </label>
          <label
            >商品名称
            <input v-model.trim="form.name" required />
          </label>
          <label
            >供应商
            <input v-model.trim="form.supplier" />
          </label>
          <label
            >成本价
            <input v-model.number="form.cost" type="number" step="0.01" min="0" required />
          </label>
          <label
            >库存数量
            <input v-model.number="form.quantity" type="number" min="0" required />
          </label>
          <div class="modal-actions">
            <button type="submit">{{ editMode ? '保存' : '添加' }}</button>
            <button type="button" class="ghost" @click="closeModal">取消</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal">
        <h3>确认删除</h3>
        <p>
          确定要删除 <strong>{{ deleteTarget.name }}</strong> ({{ deleteTarget.sku }})
          吗？此操作不可撤销。
        </p>
        <div class="modal-actions">
          <button class="danger" @click="deleteItem">删除</button>
          <button class="ghost" @click="cancelDelete">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

interface InventoryItem {
  id: string
  sku: string
  name: string
  supplier?: string
  cost: number
  quantity: number
}

const router = useRouter()
const STORAGE_KEY = 'inventoryItems_v1'
const lowStockThreshold = 5

const items = ref<InventoryItem[]>([])
const query = ref('')
const page = ref(1)
const pageSize = ref(10)

const modalOpen = ref(false)
const editMode = ref(false)
const form = reactive<Partial<InventoryItem>>({
  id: undefined,
  sku: '',
  name: '',
  supplier: '',
  cost: 0,
  quantity: 0,
})

const deleteTarget = ref<InventoryItem | null>(null)

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      items.value = JSON.parse(raw)
    } catch {
      items.value = []
    }
  } else {
    // seed demo data
    items.value = [
      {
        id: uid(),
        sku: 'SKU-1001',
        name: '蓝牙鼠标',
        supplier: '供应商A',
        cost: 12.5,
        quantity: 34,
      },
      {
        id: uid(),
        sku: 'SKU-1002',
        name: '机械键盘',
        supplier: '供应商B',
        cost: 45.0,
        quantity: 8,
      },
      {
        id: uid(),
        sku: 'SKU-1003',
        name: '显示器 24"',
        supplier: '供应商C',
        cost: 120.0,
        quantity: 3,
      },
      {
        id: uid(),
        sku: 'SKU-1004',
        name: 'USB-C 线',
        supplier: '供应商A',
        cost: 3.2,
        quantity: 120,
      },
    ]
    saveToStorage()
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

onMounted(loadFromStorage)
watch(items, saveToStorage, { deep: true })

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
watch([pageSize, filtered], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

const lowStockCount = computed(
  () => items.value.filter((i) => i.quantity <= lowStockThreshold).length,
)

const totalValue = computed(() => {
  const v = items.value.reduce((sum, i) => sum + i.cost * i.quantity, 0)
  return formatCurrency(v)
})

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function openAdd() {
  editMode.value = false
  Object.assign(form, { id: undefined, sku: '', name: '', supplier: '', cost: 0, quantity: 0 })
  modalOpen.value = true
}

function openEdit(item: InventoryItem) {
  editMode.value = true
  Object.assign(form, { ...item })
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

function saveItem() {
  // basic validation
  if (!form.sku || !form.name || form.cost === undefined || form.quantity === undefined) return
  if (editMode.value && form.id) {
    const idx = items.value.findIndex((i) => i.id === form.id)
    if (idx !== -1) {
      items.value.splice(idx, 1, { ...(form as InventoryItem) })
    }
  } else {
    const newItem: InventoryItem = {
      id: uid(),
      sku: String(form.sku),
      name: String(form.name),
      supplier: form.supplier || '',
      cost: Number(form.cost) || 0,
      quantity: Number(form.quantity) || 0,
    }
    items.value.unshift(newItem)
    page.value = 1
  }
  closeModal()
}

function confirmDelete(item: InventoryItem) {
  deleteTarget.value = item
}

function cancelDelete() {
  deleteTarget.value = null
}

function deleteItem() {
  if (!deleteTarget.value) return
  const idx = items.value.findIndex((i) => i.id === deleteTarget.value!.id)
  if (idx !== -1) items.value.splice(idx, 1)
  deleteTarget.value = null
}

function goBack() {
  router.push('/dashboard')
}
</script>

<style scoped>
.inventory-container {
  max-width: 1100px;
  margin: 24px auto;
  padding: 18px;
  background: #f7f9fb;
  border-radius: 10px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #1f2937;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #4b6cb7;
}

.inventory-header h1 {
  margin: 0;
  font-size: 1.3rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e6e9ef;
  min-width: 260px;
}

.add-btn {
  background: #4b6cb7;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stats {
  display: flex;
  gap: 18px;
  color: #374151;
}

.stats .warning {
  color: #d97706;
  font-weight: 700;
}

.pagination-controls select {
  margin-left: 6px;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
}

.inventory-table thead {
  background: #f1f5f9;
  text-align: left;
}

.inventory-table th,
.inventory-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f1f1;
}

.inventory-table .actions-col {
  text-align: right;
  width: 160px;
}

.inventory-table tbody tr.low {
  background: rgba(249, 231, 159, 0.35);
}

.status {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.85rem;
  color: white;
}

.status.low {
  background: #f59e0b;
}
.status.ok {
  background: #10b981;
}

.small {
  padding: 6px 8px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: #eef2ff;
  color: #3730a3;
  margin-left: 6px;
}

.small.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.empty {
  text-align: center;
  padding: 22px;
  color: #6b7280;
}

.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.modal {
  width: 420px;
  background: white;
  padding: 18px;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(2, 6, 23, 0.2);
}

.modal h3 {
  margin: 0 0 12px;
}

.modal form label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.modal form input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e6e9ef;
  margin-top: 4px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal button {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.modal .ghost {
  background: #f3f4f6;
}

.modal .danger {
  background: #ef4444;
  color: white;
}

@media (max-width: 640px) {
  .modal {
    width: 92%;
  }
  .header-actions {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
  .search {
    min-width: 160px;
  }
}
</style>
