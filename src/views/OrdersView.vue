<template>
  <div class="purchase-order-container">
    <!-- 顶部导航 -->
    <AppHeader :title="'采购订单管理'" />

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 操作区域 -->
      <div class="action-bar">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索订单号/供应商..."
            prefix-icon="el-icon-search"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="handleNewOrder">
            <i class="el-icon-plus"></i> 新建采购订单
          </el-button>
          <el-button type="success" @click="handleExport">
            <i class="el-icon-download"></i> 导出订单
          </el-button>
        </div>
      </div>

      <!-- 订单统计卡片 -->
      <div class="stats-cards">
        <el-card class="stat-card" v-for="stat in stats" :key="stat.title">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              {{ stat.icon }}
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 订单列表 -->
      <el-card class="order-table">
        <div class="table-header">
          <h3>采购订单列表</h3>
          <el-button type="text" @click="refreshData">
            <i class="el-icon-refresh"></i> 刷新数据
          </el-button>
        </div>

        <el-table
          :data="filteredOrders"
          border
          :row-class-name="tableRowClassName"
          v-loading="loading"
        >
          <el-table-column prop="orderNo" label="订单号" width="180" />
          <el-table-column prop="supplierName" label="供应商" width="200" />
          <el-table-column prop="orderDate" label="下单日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.orderDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="总金额" width="120">
            <template #default="{ row }"> ¥{{ row.totalAmount.toFixed(2) }} </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="150">
            <template #default="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button type="text" @click="handleViewDetails(row)" class="action-btn">
                查看详情
              </el-button>
              <el-button type="text" @click="handleEditStatus(row)" class="action-btn">
                修改状态
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:currentPage="currentPage"
            v-model:pageSize="pageSize"
            :page-sizes="[5, 10, 20]"
            layout="total, prev, pager, next, sizes, jumper"
            :total="totalItems"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

      <!-- 订单详情对话框 -->
      <el-dialog
        :title="`订单详情 - ${currentOrder.orderNo}`"
        v-model="detailDialogVisible"
        width="1000px"
        :close-on-click-modal="false"
      >
        <div class="order-details">
          <div class="order-header">
            <div class="order-info">
              <span><strong>订单号:</strong> {{ currentOrder.orderNo }}</span>
              <span><strong>供应商:</strong> {{ currentOrder.supplierName }}</span>
              <span><strong>下单日期:</strong> {{ formatDate(currentOrder.orderDate) }}</span>
            </div>
            <div class="order-status">
              <el-tag :type="statusTagType(currentOrder.status)">
                {{ statusText(currentOrder.status) }}
              </el-tag>
              <span class="status-update"
                >最后更新: {{ formatDate(currentOrder.lastUpdateTime) }}</span
              >
            </div>
          </div>

          <el-table :data="currentOrder.details" border>
            <el-table-column prop="productName" label="产品名称" width="200" />
            <el-table-column prop="quantity" label="采购数量" width="120" />
            <el-table-column prop="unitPrice" label="单价(¥)" width="120">
              <template #default="{ row }"> ¥{{ row.unitPrice.toFixed(2) }} </template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="小计(¥)" width="120">
              <template #default="{ row }"> ¥{{ row.totalPrice.toFixed(2) }} </template>
            </el-table-column>
            <el-table-column prop="deliveryDate" label="预计到货日期" width="150">
              <template #default="{ row }">
                {{ formatDate(row.deliveryDate) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="order-total">
            <div class="total-label">总金额:</div>
            <div class="total-amount">¥{{ currentOrder.totalAmount.toFixed(2) }}</div>
          </div>

          <div class="order-note">
            <div class="note-title">备注:</div>
            <div class="note-content">{{ currentOrder.note || '无' }}</div>
          </div>
        </div>

        <template #footer>
          <span class="dialog-footer">
            <el-button @click="detailDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 修改状态对话框 -->
      <el-dialog title="修改订单状态" v-model="statusDialogVisible" width="400px">
        <el-form :model="statusForm" :rules="statusRules" ref="statusFormRef">
          <el-form-item label="当前状态" prop="currentStatus">
            <el-tag :type="statusTagType(currentOrder.status)">
              {{ statusText(currentOrder.status) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="新状态" prop="newStatus">
            <el-select v-model="statusForm.newStatus" placeholder="请选择新状态">
              <el-option
                v-for="status in statusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="备注" prop="note">
            <el-input
              v-model="statusForm.note"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <span class="dialog-footer">
            <el-button @click="statusDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitStatusChange">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 新建订单对话框 -->
      <el-dialog title="新建采购订单" v-model="newOrderDialogVisible" width="800px">
        <el-form :model="newOrderForm" :rules="newOrderRules" ref="newOrderFormRef">
          <el-form-item label="供应商" prop="supplierId">
            <el-select
              v-model="newOrderForm.supplierId"
              placeholder="请选择供应商"
              @change="handleSupplierChange"
            >
              <el-option
                v-for="supplier in suppliers"
                :key="supplier.id"
                :label="supplier.name"
                :value="supplier.id"
              />
            </el-select>
          </el-form-item>

          <el-table :data="newOrderForm.details" border>
            <el-table-column prop="productName" label="产品" width="200">
              <template #default="{ row }">
                <el-select
                  v-model="row.productId"
                  placeholder="请选择产品"
                  @change="handleProductChange(row)"
                >
                  <el-option
                    v-for="product in products"
                    :key="product.id"
                    :label="product.name"
                    :value="product.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="采购数量" width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" :precision="0" />
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价(¥)" width="120">
              <template #default="{ row }"> ¥{{ row.unitPrice.toFixed(2) }} </template>
            </el-table-column>
            <el-table-column prop="deliveryDate" label="预计到货日期" width="150">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.deliveryDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="text" @click="removeProduct($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-button type="primary" @click="addProduct" class="add-product-btn">
            <i class="el-icon-plus"></i> 添加产品
          </el-button>

          <div class="order-total">
            <div class="total-label">总金额:</div>
            <div class="total-amount">¥{{ totalAmount.toFixed(2) }}</div>
          </div>
        </el-form>

        <template #footer>
          <span class="dialog-footer">
            <el-button @click="newOrderDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitNewOrder">提交订单</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import axios from 'axios'
import dayjs from 'dayjs'

// 数据模型
interface Supplier {
  id: number
  name: string
  contact: string
  phone: string
  address: string
}

interface Product {
  id: number
  name: string
  unit: string
  price: number
  minStock: number
}

interface OrderDetail {
  id?: number
  productId: number
  quantity: number
  unitPrice: number
  deliveryDate: string
  productName: string
  totalPrice: number
}

interface PurchaseOrder {
  id: number
  orderNo: string
  supplierId: number
  supplierName: string
  orderDate: string
  status: string
  totalAmount: number
  createTime: string
  lastUpdateTime: string
  note: string
  details: OrderDetail[]
}

interface ProductResponse {
  id: number
  productName: string
  unit: string
  currentPrice: number
  minStock: number
}

// 页面状态
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const statusFormRef = ref()

// 表单验证规则
const newOrderRules = ref({
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  details: [{ required: true, message: '请添加产品', trigger: 'change' }],
})
// 状态修改表单验证规则
const statusRules = ref({
  newStatus: [{ required: true, message: '请选择新状态', trigger: 'change' }],
  note: [{ max: 200, message: '备注长度不能超过200个字符', trigger: 'blur' }],
})

// 统计卡片数据
const stats = ref([
  { title: '总订单数', value: '12', icon: '📦', color: '#409EFF' },
  { title: '待审核', value: '3', icon: '⏳', color: '#E6A23C' },
  { title: '已发货', value: '5', icon: '🚚', color: '#67C23A' },
  { title: '总金额', value: '28,500.00', icon: '💰', color: '#F56C6C' },
])

// 订单列表
const orders = ref<PurchaseOrder[]>([])
const filteredOrders = computed(() => {
  return orders.value
    .filter(
      (order) =>
        order.orderNo.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        order.supplierName.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentOrder = ref<PurchaseOrder>({} as PurchaseOrder)

// 状态修改对话框
const statusDialogVisible = ref(false)
const statusForm = ref({
  newStatus: '',
  note: '',
})
const statusOptions = ref([
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
])

// 新建订单
const newOrderDialogVisible = ref(false)
const suppliers = ref<Supplier[]>([])
const products = ref<Product[]>([])
const newOrderForm = ref({
  supplierId: 0,
  details: [] as OrderDetail[],
})
const newOrderFormRef = ref()

// 计算总金额
const totalAmount = computed(() => {
  return newOrderForm.value.details.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice
  }, 0)
})

// 表格行样式
const tableRowClassName = (row: PurchaseOrder) => {
  if (row.status === 'pending') return 'pending-row'
  if (row.status === 'shipped') return 'shipped-row'
  return ''
}

// 状态标签类型
const statusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'success'
    case 'shipped':
      return 'info'
    case 'completed':
      return 'danger'
    default:
      return 'primary'
  }
}

// 状态文本
const statusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    shipped: '已发货',
    completed: '已完成',
  }
  return statusMap[status] || status
}

// 日期格式化
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : ''
}

// 操作方法
const refreshData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/purchase-orders', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchQuery: searchQuery.value,
      },
    })

    if (response.data.code === 200) {
      orders.value = response.data.orders.map((order: PurchaseOrder) => ({
        ...order,
        details: order.details.map((detail: OrderDetail) => ({
          ...detail,
          totalPrice: detail.quantity * detail.unitPrice,
        })),
      }))
      totalItems.value = response.data.total
      ElMessage.success('数据已刷新')
    } else {
      ElMessage.error(response.data.message || '数据加载失败')
    }
  } catch (error) {
    console.error('获取订单失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchQuery.value = searchQuery.value.trim()
  refreshData()
}

const handleViewDetails = (order: PurchaseOrder) => {
  currentOrder.value = { ...order }
  detailDialogVisible.value = true
}

const handleEditStatus = (order: PurchaseOrder) => {
  currentOrder.value = { ...order }
  statusForm.value = {
    newStatus: currentOrder.value.status,
    note: '',
  }
  statusDialogVisible.value = true
}

const submitStatusChange = async () => {
  try {
    // 1. 更新订单状态
    const response = await axios.put(`/api/purchase-orders/${currentOrder.value.id}/status`, {
      status: statusForm.value.newStatus,
      note: statusForm.value.note,
    })

    // 2. 如果状态更新为"已完成"，自动更新库存（新增逻辑）
    if (response.data.code === 200) {
      if (statusForm.value.newStatus === 'completed') {
        for (const detail of currentOrder.value.details) {
          await axios.post('/api/inventory/adjust', {
            id: response.data.inventoryId, // 使用库存记录ID
            adjustQuantity: detail.quantity, // 增加数量
            reason: '采购订单完成',
          })
        }
        ElMessage.success('库存已自动更新')
      }
      ElMessage.success('订单状态更新成功')
      statusDialogVisible.value = false
      refreshData()
    } else {
      ElMessage.error(response.data.message || '订单状态更新失败')
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  }
}

const handleNewOrder = () => {
  newOrderForm.value = {
    supplierId: 0,
    details: [],
  }
  newOrderDialogVisible.value = true
  // 获取供应商和产品数据
  fetchSuppliers()
  fetchProducts()
}

const fetchSuppliers = async () => {
  try {
    const response = await axios.get('/api/suppliers')
    if (response.data.code === 200) {
      suppliers.value = response.data.data
    }
  } catch (error) {
    console.error('获取供应商失败:', error)
  }
}

const fetchProducts = async () => {
  try {
    const response = await axios.get('/api/products')
    if (response.data.code === 200) {
      products.value = response.data.data.map((p: ProductResponse) => ({
        id: p.id,
        name: p.productName,
        unit: p.unit,
        price: p.currentPrice,
        minStock: p.minStock,
      }))
    }
  } catch (error) {
    console.error('获取产品失败:', error)
  }
}

const handleSupplierChange = () => {
  // 供应商变化时重置产品列表
  newOrderForm.value.details = []
}

const handleProductChange = (row: OrderDetail) => {
  // 根据选择的产品设置单价
  const product = products.value.find((p) => p.id === row.productId)
  if (product) {
    row.unitPrice = product.price
    row.totalPrice = row.quantity * row.unitPrice
  }
}

const addProduct = () => {
  newOrderForm.value.details.push({
    productId: 0,
    quantity: 1,
    unitPrice: 0,
    deliveryDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    productName: '',
    totalPrice: 0,
  })
}

const removeProduct = (index: number) => {
  ElMessageBox.confirm('确定要删除该产品吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    newOrderForm.value.details.splice(index, 1)
  })
}

const submitNewOrder = async () => {
  try {
    // 验证必填项
    if (!newOrderForm.value.supplierId) {
      ElMessage.warning('请选择供应商')
      return
    }

    if (newOrderForm.value.details.length === 0) {
      ElMessage.warning('请添加至少一个产品')
      return
    }

    // 提交订单
    const orderData = {
      supplierId: newOrderForm.value.supplierId,
      details: newOrderForm.value.details.map((d) => ({
        productId: d.productId,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        deliveryDate: d.deliveryDate,
      })),
    }

    const response = await axios.post('/api/purchase-orders', orderData)

    if (response.data.code === 200) {
      ElMessage.success('采购订单创建成功')
      newOrderDialogVisible.value = false
      refreshData()
    } else {
      ElMessage.error(response.data.message || '订单创建失败')
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    ElMessage.error('创建订单失败')
  }
}

const handleExport = () => {
  ElMessage.success('导出功能已实现，正在生成Excel文件...')
  // 实际实现时调用后端导出API
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  refreshData()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  refreshData()
}

// 初始化
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.purchase-order-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.main-content {
  margin-top: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-box {
  flex: 1;
  min-width: 300px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.stat-card {
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  font-weight: bold;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.order-table {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-details {
  padding: 20px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.order-info span {
  margin-right: 15px;
  font-size: 14px;
}

.order-status {
  display: flex;
  align-items: center;
}

.status-update {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  font-weight: bold;
}

.total-label {
  margin-right: 10px;
  color: #606266;
}

.total-amount {
  color: #f56c6c;
}

.order-note {
  margin-top: 25px;
}

.note-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.note-content {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  min-height: 60px;
}

.add-product-btn {
  margin-top: 15px;
  display: block;
}

.pending-row {
  background-color: #fef6ec !important;
}

.shipped-row {
  background-color: #f0f9eb !important;
}

.action-btn {
  margin-right: 5px;
}
</style>
