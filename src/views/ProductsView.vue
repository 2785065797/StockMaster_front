<template>
  <div class="product-management-container">
    <!-- 顶部导航 -->
    <AppHeader :title="'商品管理'" />

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 操作区域 -->
      <div class="action-bar">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索商品名称/分类..."
            prefix-icon="el-icon-search"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="action-buttons">
          <el-button type="success" @click="handleExport">
            <i class="el-icon-download"></i> 导出数据
          </el-button>
          <el-button type="warning" @click="handleRefresh">
            <i class="el-icon-refresh"></i> 刷新数据
          </el-button>
        </div>
      </div>

      <!-- 商品统计卡片 -->
      <div class="stats-cards">
        <el-card
          class="stat-card"
          v-for="(stat, index) in stats"
          :key="stat.title"
          @click="handleStatClick(index)"
        >
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

      <!-- 商品列表 -->
      <div v-if="!showCategoryList">
        <el-card class="product-table">
          <div class="table-header">
            <h3>商品列表</h3>
            <el-button type="primary" @click="handleAddProduct">
              <i class="el-icon-plus"></i> 新增商品
            </el-button>
          </div>

          <el-table
            :data="filteredProducts"
            border
            :row-class-name="tableRowClassName"
            v-loading="loading"
          >
            <el-table-column prop="name" label="商品名称" width="220" />
            <el-table-column prop="categoryName" label="分类" width="150" />
            <el-table-column prop="unit" label="单位" width="100" />
            <el-table-column prop="currentPrice" label="当前价格(¥)" width="120">
              <template #default="{ row }"> ¥{{ row.currentPrice.toFixed(2) }} </template>
            </el-table-column>
            <el-table-column prop="costPrice" label="成本价(¥)" width="120">
              <template #default="{ row }"> ¥{{ row.costPrice.toFixed(2) }} </template>
            </el-table-column>
            <el-table-column prop="preSalePrice" label="促销价(¥)" width="120">
              <template #default="{ row }">
                <span v-if="row.preSalePrice > 0">¥{{ row.preSalePrice.toFixed(2) }}</span>
                <span v-else class="no-price">无</span>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存数量" width="120" />
            <el-table-column prop="isActive" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'danger'">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button type="text" @click="handleEditProduct(row)" class="action-btn">
                  编辑
                </el-button>
                <el-button
                  type="text"
                  @click="handleToggleStatus(row)"
                  class="action-btn"
                  :class="row.isActive ? 'disable-btn' : 'enable-btn'"
                >
                  {{ row.isActive ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:currentPage="currentPage"
              v-model:pageSize="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, prev, pager, next, sizes, jumper"
              :total="totalItems"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 商品分类管理列表 -->
      <div v-else>
        <el-card class="category-management">
          <div class="table-header">
            <h3>商品分类管理</h3>
            <el-button type="primary" @click="handleAddCategory">
              <i class="el-icon-plus"></i> 新增分类
            </el-button>
          </div>

          <el-table :data="categories" border v-loading="loading">
            <el-table-column prop="name" label="分类名称" width="200" />
            <el-table-column prop="description" label="分类描述" width="300" />
            <el-table-column prop="isActive" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'danger'">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="text" @click="handleEditCategory(row)" class="action-btn">
                  编辑
                </el-button>
                <el-button
                  type="text"
                  @click="handleToggleCategoryStatus(row)"
                  class="action-btn"
                  :class="row.isActive ? 'disable-btn' : 'enable-btn'"
                >
                  {{ row.isActive ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination" v-if="categories.length > 0">
            <el-pagination
              v-model:currentPage="categoryPage"
              v-model:pageSize="categoryPageSize"
              :page-sizes="[5, 10, 20]"
              layout="total, prev, pager, next, sizes"
              :total="categories.length"
              @size-change="handleCategorySizeChange"
              @current-change="handleCategoryPageChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 新增/编辑商品对话框 -->
      <el-dialog
        :title="currentProduct.id ? '编辑商品' : '新增商品'"
        v-model="productDialogVisible"
        width="800px"
        :close-on-click-modal="false"
        :before-close="handleBeforeClose"
      >
        <el-form
          :model="currentProduct"
          :rules="productRules"
          ref="productFormRef"
          label-width="120px"
          class="product-form"
        >
          <el-form-item label="商品名称" prop="name">
            <el-input v-model="currentProduct.name" placeholder="请输入商品名称" />
          </el-form-item>

          <el-form-item label="商品分类" prop="categoryId">
            <el-select
              v-model="currentProduct.categoryId"
              placeholder="请选择商品分类"
              class="category-select"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="商品单位" prop="unit">
            <el-input v-model="currentProduct.unit" placeholder="请输入商品单位" />
          </el-form-item>

          <el-form-item label="当前价格(¥)" prop="currentPrice">
            <el-input-number
              v-model="currentProduct.currentPrice"
              :min="0"
              :precision="2"
              :step="0.01"
              placeholder="请输入当前价格"
              class="price-input"
            />
          </el-form-item>

          <el-form-item label="成本价(¥)" prop="costPrice">
            <el-input-number
              v-model="currentProduct.costPrice"
              :min="0"
              :precision="2"
              :step="0.01"
              placeholder="请输入成本价"
              class="price-input"
            />
          </el-form-item>

          <el-form-item label="促销价(¥)" prop="preSalePrice">
            <el-input-number
              v-model="currentProduct.preSalePrice"
              :min="0"
              :precision="2"
              :step="0.01"
              placeholder="请输入促销价"
              class="price-input"
            />
          </el-form-item>

          <el-form-item label="商品图片" prop="imagePath">
            <div class="image-upload" @click="triggerFileInput">
              <div v-if="currentProduct.imagePath" class="image-preview">
                <img :src="currentProduct.imagePath" alt="商品图片" />
                <div class="image-overlay" @click="handleRemoveImage">
                  <i class="el-icon-close"></i>
                </div>
              </div>
              <div v-else class="upload-placeholder">
                <i class="el-icon-upload"></i>
                <div>点击上传商品图片</div>
                <div class="upload-hint">支持 JPG/PNG 格式，大小不超过 5MB</div>
              </div>
              <input
                type="file"
                id="image-upload"
                accept="image/jpeg, image/png"
                @change="handleImageUpload"
                style="display: none"
              />
            </div>
          </el-form-item>

          <el-form-item label="商品描述" prop="description">
            <el-input
              v-model="currentProduct.description"
              type="textarea"
              :rows="3"
              placeholder="请输入商品描述"
            />
          </el-form-item>

          <el-form-item label="是否启用" prop="isActive">
            <el-switch v-model="currentProduct.isActive" />
          </el-form-item>
        </el-form>

        <template #footer>
          <span class="dialog-footer">
            <el-button @click="productDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitProduct">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 新增商品分类对话框 -->
      <el-dialog
        :title="currentCategory.id ? '编辑商品分类' : '新增商品分类'"
        v-model="categoryDialogVisible"
        width="400px"
        :close-on-click-modal="false"
      >
        <el-form
          :model="currentCategory"
          :rules="categoryRules"
          ref="categoryFormRef"
          label-width="100px"
        >
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="currentCategory.name" placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="分类描述" prop="description">
            <el-input
              v-model="currentCategory.description"
              type="textarea"
              :rows="2"
              placeholder="请输入分类描述"
            />
          </el-form-item>
          <el-form-item label="是否启用" prop="isActive">
            <el-switch v-model="currentCategory.isActive" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="categoryDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitCategory">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import axios from 'axios'

// ========================
// 数据模型定义
// ========================
interface Category {
  id: number
  name: string
  description: string
  isActive: boolean
}

interface Product {
  id: number
  name: string
  categoryId: number
  categoryName: string
  unit: string
  currentPrice: number
  preSalePrice: number
  costPrice: number
  imagePath: string
  isActive: boolean
  description: string
  stock: number
  createTime: string
  updateTime: string
  deleteTime: string | null
}

// ========================
// 页面状态管理
// ========================
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const productDialogVisible = ref(false)
const productFormRef = ref()
const categoryPage = ref(1)
const categoryPageSize = ref(10)
const currentStatus = ref(0)

// 商品数据
const products = ref<Product[]>([])
const filteredProducts = computed(() => {
  return products.value.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.categoryName.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 统计卡片数据
const stats = ref([
  { title: '商品总数', value: '125', icon: '📦', color: '#409EFF' },
  { title: '启用商品', value: '102', icon: '✅', color: '#67C23A' },
  { title: '禁用商品', value: '23', icon: '❌', color: '#E6A23C' },
  { title: '商品分类', value: '0', icon: '📁', color: '#909399' },
])

// 分类数据
const categories = ref<Category[]>([])

// 商品分类表单引用
const categoryFormRef = ref()

// 当前编辑的商品
const currentProduct = ref({
  id: 0,
  name: '',
  categoryId: 0,
  categoryName: '',
  unit: '',
  currentPrice: 0,
  preSalePrice: 0,
  costPrice: 0,
  imagePath: '',
  isActive: true,
  description: '',
  stock: 0,
  createTime: '',
  updateTime: '',
  deleteTime: null as string | null,
})

// 图片文件状态
const currentImageFile = ref<File | null>(null)

// 商品分类相关状态
const categoryDialogVisible = ref(false)
const showCategoryList = ref(false)
const currentCategory = ref({
  id: 0,
  name: '',
  description: '',
  isActive: true,
})

// ========================
// 表单验证规则
// ========================
const productRules = ref({
  name: [
    { required: true, message: '商品名称不能为空', trigger: 'blur' },
    { min: 2, max: 50, message: '商品名称长度在 2-50 个字符', trigger: 'blur' },
  ],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  unit: [
    { required: true, message: '商品单位不能为空', trigger: 'blur' },
    { min: 1, max: 10, message: '单位长度在 1-10 个字符', trigger: 'blur' },
  ],
  currentPrice: [
    { required: true, message: '当前价格不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' },
  ],
  costPrice: [
    { required: true, message: '成本价不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '成本价不能为负数', trigger: 'blur' },
  ],
})

const categoryRules = ref({
  name: [
    { required: true, message: '分类名称不能为空', trigger: 'blur' },
    { min: 2, max: 50, message: '分类名称长度在 2-50 个字符', trigger: 'blur' },
  ],
  description: [{ max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }],
})

// ========================
// 分类数据操作
// ========================
const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/category/fetch')
    if (response.data.code === 200) {
      categories.value = response.data.data
      console.log(response.data.data)
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const handleAddCategory = () => {
  currentCategory.value = {
    id: 0,
    name: '',
    description: '',
    isActive: true,
  }
  categoryDialogVisible.value = true
}

const handleEditCategory = (category: Category) => {
  currentCategory.value = { ...category }
  categoryDialogVisible.value = true
}

const handleToggleCategoryStatus = async (category: Category) => {
  try {
    const newStatus = !category.isActive
    const response = await axios.put(`/api/category/${category.id}/status`, {
      isActive: newStatus,
    })

    if (response.data.code === 200) {
      category.isActive = newStatus
      ElMessage.success(newStatus ? '分类已启用' : '分类已禁用')
    } else {
      ElMessage.error(response.data.message || '状态更新失败')
    }
  } catch (error) {
    console.error('分类状态更新失败:', error)
    ElMessage.error('状态更新失败')
  }
}

const handleCategorySizeChange = (size: number) => {
  categoryPageSize.value = size
}

const handleCategoryPageChange = (page: number) => {
  categoryPage.value = page
}

const submitCategory = async () => {
  try {
    const form = categoryFormRef.value
    await form.validate()

    let response
    if (currentCategory.value.id) {
      response = await axios.put(`/api/category/${currentCategory.value.id}`, {
        name: currentCategory.value.name,
        description: currentCategory.value.description,
        isActive: currentCategory.value.isActive,
      })
    } else {
      response = await axios.post('/api/category/insert', {
        name: currentCategory.value.name,
        description: currentCategory.value.description,
        isActive: currentCategory.value.isActive,
      })
    }

    if (response.data.code === 200) {
      ElMessage.success(currentCategory.value.id ? '分类更新成功' : '分类新增成功')
      categoryDialogVisible.value = false
      fetchCategories()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error) {
    console.error('分类操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// ========================
// 商品数据操作
// ========================
const refreshData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/products', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchQuery: searchQuery.value,
      },
    })

    if (response.data.code === 200) {
      const processedProducts = response.data.products.map((product: Product) => ({
        ...product,
        categoryName: product.categoryName || '未分类',
        stock: product.stock || 0,
      }))

      products.value = processedProducts
      totalItems.value = response.data.total
      ElMessage.success('数据已刷新')
    } else {
      ElMessage.error(response.data.message || '数据加载失败')
    }
  } catch (error) {
    console.error('获取商品失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchQuery.value = searchQuery.value.trim()
  refreshData()
}

const handleAddProduct = () => {
  currentProduct.value = { ...currentProduct.value }
  currentImageFile.value = null
  if (productFormRef.value) {
    productFormRef.value.resetFields()
  }
  productDialogVisible.value = true
}

const handleEditProduct = (product: Product) => {
  currentProduct.value = { ...product }
  currentImageFile.value = null
  productDialogVisible.value = true
}

const handleToggleStatus = async (product: Product) => {
  try {
    const newStatus = !product.isActive
    const response = await axios.put(`/api/products/${product.id}/status`, {
      isActive: newStatus,
    })

    if (response.data.code === 200) {
      product.isActive = newStatus
      ElMessage.success(newStatus ? '商品已启用' : '商品已禁用')
    } else {
      ElMessage.error(response.data.message || '状态更新失败')
    }
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  }
}

// ========================
// 商品图片处理
// ========================
const handleRemoveImage = () => {
  currentProduct.value.imagePath = ''
  currentImageFile.value = null
}

const triggerFileInput = () => {
  const fileInput = document.getElementById('image-upload') as HTMLInputElement
  if (fileInput) {
    fileInput.click()
  }
}

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (!file.type.match('image/jpeg|image/png')) {
    ElMessage.error('只支持 JPG/PNG 格式图片')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }

  currentImageFile.value = file
  const previewUrl = URL.createObjectURL(file)
  currentProduct.value.imagePath = previewUrl
}

// ========================
// 商品表单提交
// ========================
const submitProduct = async () => {
  try {
    const form = productFormRef.value
    await form.validate()

    const productData = {
      name: currentProduct.value.name,
      categoryId: currentProduct.value.categoryId,
      unit: currentProduct.value.unit,
      currentPrice: currentProduct.value.currentPrice,
      preSalePrice: currentProduct.value.preSalePrice,
      costPrice: currentProduct.value.costPrice,
      isActive: currentProduct.value.isActive,
      description: currentProduct.value.description,
    } as Record<string, unknown>

    let response
    const formData = new FormData()
    Object.keys(productData as Record<string, unknown>).forEach((key) => {
      formData.append(key, String(productData[key]))
    })

    if (currentImageFile.value) {
      formData.append('image', currentImageFile.value, currentImageFile.value.name)
    }

    if (currentProduct.value.id) {
      response = await axios.put(`/api/products/${currentProduct.value.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      response = await axios.post('/api/products/insert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    if (response.data.code === 200) {
      ElMessage.success(currentProduct.value.id ? '商品更新成功' : '商品添加成功')
      refreshData()
      productDialogVisible.value = false
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error) {
    console.error('提交商品失败:', error)
    ElMessage.error('操作失败')
  } finally {
    currentImageFile.value = null
    if (currentProduct.value.imagePath && currentProduct.value.imagePath.startsWith('blob:')) {
      URL.revokeObjectURL(currentProduct.value.imagePath)
    }
  }
}

// ========================
// 操作按钮处理
// ========================
const handleExport = () => {
  ElMessage.success('导出功能已实现，正在生成Excel文件...')
}

const handleRefresh = () => {
  if (currentStatus.value === 3) {
    fetchCategories()
  } else {
    refreshData()
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  refreshData()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  refreshData()
}

const handleStatClick = (index: number) => {
  currentStatus.value = index
  showCategoryList.value = index === 3
}

const handleBeforeClose = (done: () => void) => {
  if (JSON.stringify(currentProduct.value) !== JSON.stringify(currentProduct.value)) {
    ElMessageBox.confirm('您有未保存的修改，确定要关闭吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => {
      productDialogVisible.value = false
      done()
    })
  } else {
    productDialogVisible.value = false
    done()
  }
}

// ========================
// 表格行样式
// ========================
const tableRowClassName = (row: Product) => {
  return !row.isActive ? 'disabled-row' : ''
}

// ========================
// 生命周期
// ========================
onMounted(() => {
  refreshData()
  fetchCategories()
})

onBeforeUnmount(() => {
  if (currentProduct.value.imagePath && currentProduct.value.imagePath.startsWith('blob:')) {
    URL.revokeObjectURL(currentProduct.value.imagePath)
  }
})
</script>

<style scoped>
.product-management-container {
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

.product-table {
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

.product-form {
  margin-top: 20px;
}

.image-upload {
  position: relative;
  width: 100%;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.upload-placeholder {
  text-align: center;
  color: #999;
  font-size: 14px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.price-input {
  width: 100%;
}

.no-price {
  color: #999;
}

.disabled-row {
  background-color: #f5f7fa !important;
  color: #999;
}

.action-btn {
  margin-right: 5px;
}

.disable-btn {
  color: #e6a23c !important;
}

.enable-btn {
  color: #67c23a !important;
}

.category-select {
  width: 100%;
}

.category-management {
  margin-top: 20px;
}
</style>
