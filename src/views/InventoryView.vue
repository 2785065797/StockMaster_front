<template>
  <div class="inventory-container">
    <!-- 顶部导航 -->
    <AppHeader :title="'库存管理'" />

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 操作区域 -->
      <div class="action-bar">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索产品名称..."
            prefix-icon="el-icon-search"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="handleStockAdjust">
            <i class="el-icon-plus"></i> 库存调整
          </el-button>
          <el-button type="success" @click="handleReplenish">
            <i class="el-icon-refresh"></i> 补货申请
          </el-button>
        </div>
      </div>

      <!-- 库存统计卡片 -->
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

      <!-- 库存列表 -->
      <el-card class="inventory-table">
        <div class="table-header">
          <h3>库存明细</h3>
          <el-button type="text" @click="refreshData">
            <i class="el-icon-refresh"></i> 刷新数据
          </el-button>
        </div>

        <el-table
          :data="filteredInventory"
          border
          :row-class-name="tableRowClassName"
          v-loading="loading"
        >
          <el-table-column prop="productName" label="产品名称" width="200" />
          <el-table-column prop="warehouseName" label="仓库" width="150" />
          <el-table-column prop="stockCount" label="当前库存" width="120">
            <template #default="{ row }">
              <span :class="stockStatusClass(row.stockCount, row.minStock)">
                {{ row.stockCount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="minStock" label="最低库存" width="120" />
          <el-table-column prop="stockStatus" label="库存状态" width="150">
            <template #default="{ row }">
              <el-tag :type="stockStatusTagType(row.stockCount, row.minStock)">
                {{ row.stockStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="text" @click="handleViewDetails(row)" class="action-btn">
                查看详情
              </el-button>
              <el-button type="text" @click="handleAdjustStock(row)" class="action-btn">
                调整库存
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:currentPage="currentPage"
            v-model:pageSize="pageSize"
            :pageSizes="[5, 10, 20]"
            layout="total, prev, pager, next, sizes ,jumper"
            :total="totalItems"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 库存调整对话框 -->
    <el-dialog title="库存调整" v-model="adjustDialogVisible" width="500px">
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustFormRef">
        <el-form-item label="产品" prop="productName">
          <el-input v-model="adjustForm.productName" disabled />
        </el-form-item>
        <el-form-item label="当前库存" prop="currentStock">
          <el-input v-model="adjustForm.currentStock" disabled />
        </el-form-item>
        <el-form-item label="调整数量" prop="adjustQuantity">
          <el-input-number v-model="adjustForm.adjustQuantity" :min="1" :precision="0" />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="adjustDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAdjust">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 补货申请对话框 -->
    <el-dialog title="补货申请" v-model="replenishDialogVisible" width="500px">
      <el-form :model="replenishForm" :rules="replenishRules" ref="replenishFormRef">
        <el-form-item label="产品" prop="productName">
          <el-input v-model="replenishForm.productName" disabled />
        </el-form-item>
        <el-form-item label="当前库存" prop="currentStock">
          <el-input v-model="replenishForm.currentStock" disabled />
        </el-form-item>
        <el-form-item label="需要补货数量" prop="quantity">
          <el-input-number v-model="replenishForm.quantity" :min="1" :precision="0" />
        </el-form-item>
        <el-form-item label="补货原因" prop="reason">
          <el-input v-model="replenishForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="replenishDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReplenish">提交申请</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { dayjs, ElMessage } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import axios from 'axios'

interface InventoryItem {
  id: number
  productId: number
  warehouseName: string
  stockCount: number
  minStock: number
  createTime: string
  lastUpdateTime: string
  deleteTime: string | null
  isActive: boolean
  productName: string
  stockStatus: string
}
const inventoryData = ref<InventoryItem[]>([])
// 模拟库存数据
// const inventoryData = ref([
//   {
//     id: 1,
//     product_id: 101,
//     warehouse_id: 1,
//     stock_count: 45,
//     min_stock: 50,
//     create_time: '2023-12-01',
//     last_update_time: '2023-12-05',
//     delete_time: null,
//     is_active: true,
//     productName: '无线蓝牙耳机',
//     warehouseName: '主仓库',
//     stockStatus: '正常',
//   },
//   {
//     id: 2,
//     product_id: 102,
//     warehouse_id: 2,
//     stock_count: 25,
//     min_stock: 30,
//     create_time: '2023-11-20',
//     last_update_time: '2023-12-03',
//     delete_time: null,
//     is_active: true,
//     productName: '智能手表',
//     warehouseName: '分仓库A',
//     stockStatus: '低库存',
//   },
//   {
//     id: 3,
//     product_id: 103,
//     warehouse_id: 1,
//     stock_count: 8,
//     min_stock: 10,
//     create_time: '2023-10-15',
//     last_update_time: '2023-12-01',
//     delete_time: null,
//     is_active: true,
//     productName: '手机充电器',
//     warehouseName: '主仓库',
//     stockStatus: '低库存',
//   },
//   {
//     id: 4,
//     product_id: 104,
//     warehouse_id: 3,
//     stock_count: 120,
//     min_stock: 100,
//     create_time: '2023-12-01',
//     last_update_time: '2023-12-05',
//     delete_time: null,
//     is_active: true,
//     productName: '笔记本电脑',
//     warehouseName: '分仓库B',
//     stockStatus: '正常',
//   },
//   {
//     id: 5,
//     product_id: 105,
//     warehouse_id: 2,
//     stock_count: 3,
//     min_stock: 5,
//     create_time: '2023-12-02',
//     last_update_time: '2023-12-04',
//     delete_time: null,
//     is_active: true,
//     productName: '智能音箱',
//     warehouseName: '分仓库A',
//     stockStatus: '紧急低库存',
//   },
// ])

// 页面状态
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 统计卡片数据
const stats = ref([
  { title: '总产品数', value: '5', icon: '📦', color: '#409EFF' },
  { title: '低库存产品', value: '3', icon: '⚠️', color: '#E6A23C' },
  { title: '库存总量', value: '201', icon: '📊', color: '#67C23A' },
  { title: '仓库数量', value: '3', icon: '🏠', color: '#F56C6C' },
])

// 表格数据
const inventory = computed(() => {
  return inventoryData.value.filter(
    (item) =>
      item.isActive && item.productName.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 过滤后的库存数据
const filteredInventory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return inventory.value.slice(start, end)
})

// 库存状态计算
const stockStatusClass = (current: number, min: number) => {
  if (current < min * 0.3) return 'stock-status-danger'
  if (current < min * 0.7) return 'stock-status-warning'
  return 'stock-status-normal'
}

const stockStatusTagType = (current: number, min: number) => {
  if (current < min * 0.3) return 'danger'
  if (current < min * 0.7) return 'warning'
  return 'success'
}

// 表格行样式
const tableRowClassName = (row: InventoryItem) => {
  if (row.stockCount < row.minStock * 0.3) return 'danger-row'
  if (row.stockCount < row.minStock * 0.7) return 'warning-row'
  return ''
}

// 库存调整对话框
const adjustDialogVisible = ref(false)
const adjustForm = ref({
  id: 0,
  productId: 0,
  productName: '',
  currentStock: 0,
  adjustQuantity: 1,
  reason: '',
})

const adjustRules = {
  adjustQuantity: [{ required: true, message: '请输入调整数量', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }],
}

// 补货申请对话框
const replenishDialogVisible = ref(false)
const replenishForm = ref({
  id: 0,
  productId: 0,
  productName: '',
  currentStock: 0,
  quantity: 1,
  reason: '',
})

const replenishRules = {
  quantity: [{ required: true, message: '请输入补货数量', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入补货原因', trigger: 'blur' }],
}

// 操作方法
const handleSearch = () => {
  searchQuery.value = searchQuery.value.trim()
  refreshData()
}

const refreshData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/inventory/refresh', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchQuery: searchQuery.value,
      },
    })
    if (response.data.code === 200) {
      inventoryData.value = response.data.inventoryItems
      totalItems.value = response.data.total
      ElMessage.success('数据已刷新')
    } else {
      ElMessage.error(response.data.message || '数据刷新失败')
    }
  } catch (error) {
    console.log(error)
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const handleStockAdjust = () => {
  ElMessage.warning('请选择需要调整库存的产品')
}

const handleReplenish = (row: InventoryItem) => {
  replenishForm.value = {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    currentStock: row.stockCount,
    quantity: 1,
    reason: '',
  }
  replenishDialogVisible.value = true
}

const handleViewDetails = (row: InventoryItem) => {
  ElMessage.info(`查看产品: ${row.productName} 的详细库存信息`)
}

const handleAdjustStock = (row: InventoryItem) => {
  adjustForm.value = {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    currentStock: row.stockCount,
    adjustQuantity: 1,
    reason: '',
  }
  adjustDialogVisible.value = true
}

const submitAdjust = async () => {
  try {
    await axios.post('/api/inventory/adjust', {
      id: adjustForm.value.id,
      adjustQuantity: adjustForm.value.adjustQuantity,
      reason: adjustForm.value.reason,
    })
    adjustDialogVisible.value = false
    ElMessage.success('库存调整已提交')
    refreshData()
  } catch (error) {
    console.log(error)
    ElMessage.error('库存调整失败')
  }
}

const submitReplenish = async () => {
  try {
    // 1. 提交补货申请
    await axios.post('/api/inventory/replenish', {
      id: replenishForm.value.id,
      quantity: replenishForm.value.quantity,
      reason: replenishForm.value.reason,
    })

    // 2. 创建采购订单（新增逻辑）
    const defaultSupplierId = 1 // 假设默认供应商ID为1
    const purchaseOrderData = {
      supplierId: defaultSupplierId,
      details: [
        {
          productId: replenishForm.value.productId,
          quantity: replenishForm.value.quantity,
          deliveryDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        },
      ],
    }

    await axios.post('/api/purchase-orders', purchaseOrderData)

    replenishDialogVisible.value = false
    ElMessage.success('补货申请已提交，采购订单已创建')
    refreshData()
  } catch (error) {
    console.error('补货申请或采购订单创建失败:', error)
    ElMessage.error('补货申请或采购订单创建失败')
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  refreshData()
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  refreshData()
}

// 初始化
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.inventory-container {
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

.inventory-table {
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

.stock-status-normal {
  color: #67c23a;
  font-weight: bold;
}

.stock-status-warning {
  color: #e6a23c;
  font-weight: bold;
}

.stock-status-danger {
  color: #f56c6c;
  font-weight: bold;
}

.danger-row {
  background-color: #fef0f0 !important;
}

.warning-row {
  background-color: #fdf6ec !important;
}

.action-btn {
  margin-right: 5px;
}
</style>
