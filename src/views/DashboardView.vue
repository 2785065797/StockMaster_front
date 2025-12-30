<template>
  <div class="dashboard-container">
    <!-- 顶部导航栏 -->
    <AppHeader :title="'StockMaster'" />

    <!-- 主要功能卡片 -->
    <main class="dashboard-main">
      <div class="card-grid">
        <div class="card" @click="navigateTo('inventory')">
          <div class="card-icon">📦</div>
          <h2>库存管理</h2>
          <p>实时查看和管理库存状态</p>
        </div>
        <div class="card" @click="navigateTo('orders')">
          <div class="card-icon">🛒</div>
          <h2>采购订单</h2>
          <p>管理供应商采购订单</p>
        </div>
        <div class="card" @click="navigateTo('products')">
          <div class="card-icon">➕</div>
          <h2>商品管理</h2>
          <p>添加、编辑商品信息和分类</p>
        </div>
        <div class="card" @click="navigateTo('sales')">
          <div class="card-icon">💰</div>
          <h2>销售管理</h2>
          <p>记录每笔销售，分析销售数据</p>
        </div>
        <div class="card" @click="navigateTo('suppliers')">
          <div class="card-icon">🤝</div>
          <h2>供应商管理</h2>
          <p>管理供应商信息和合作记录</p>
        </div>
        <div class="card" @click="navigateTo('stock-records')">
          <div class="card-icon">📊</div>
          <h2>出入库记录</h2>
          <p>查看所有商品流动记录</p>
        </div>
      </div>

      <!-- 库存概览卡片 -->
      <div class="overview-content">
        <div class="overview-item">
          <div class="item-value">{{ totalItems }}</div>
          <div class="item-label">商品总数</div>
        </div>
        <div class="overview-item">
          <div class="item-value">{{ lowStockItems }}</div>
          <div class="item-label">低库存商品</div>
        </div>
        <div class="overview-item">
          <div class="item-value">{{ totalValue }}</div>
          <div class="item-label">库存总价值</div>
        </div>
        <div class="overview-item">
          <div class="item-value">{{ inventoryTurnover }}</div>
          <div class="item-label">库存周转率</div>
        </div>
        <div class="overview-item">
          <div class="item-value">{{ dailySales }}</div>
          <div class="item-label">日均销售额</div>
        </div>
        <div class="overview-item">
          <div class="item-value">{{ topCategory }}</div>
          <div class="item-label">热销品类</div>
        </div>
      </div>
    </main>

    <!-- 通知区域 -->
    <div class="notifications">
      <div class="notification success">
        <span class="notification-icon">✅</span>
        <span>库存更新已成功保存</span>
        <button class="close-btn">&times;</button>
      </div>
      <div class="notification warning">
        <span class="notification-icon">⚠️</span>
        <span>有 3 件商品库存低于安全水平</span>
        <button class="close-btn">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 模拟库存数据
const totalItems = ref(428)
const lowStockItems = ref(7)
const totalValue = ref('$24,850.00')
const inventoryTurnover = ref('1.8')
const dailySales = ref('$2,850.00')
const topCategory = ref('生鲜食品')

// 路由
const router = useRouter()

const navigateTo = (path: string) => {
  router.push(`/${path}`)
}

// 模拟自动更新库存数据
onMounted(() => {
  // 模拟每5分钟更新一次库存数据
  setInterval(() => {
    totalItems.value = Math.floor(Math.random() * 500)
    lowStockItems.value = Math.min(20, Math.floor(Math.random() * 10))
    totalValue.value = `$${Math.floor(Math.random() * 50000)}.00`

    inventoryTurnover.value = (Math.random() * 3 + 1).toFixed(1)
    dailySales.value = `$${Math.floor(Math.random() * 3000 + 2000)}.00`
    topCategory.value = ['生鲜食品', '日用品', '饮料'][Math.floor(Math.random() * 3)]!
  }, 300000)
})
</script>

<style scoped>
.dashboard-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.dashboard-main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 25px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #4b6cb7;
}

.card h2 {
  color: #182848;
  margin: 10px 0 10px;
  font-size: 1.4rem;
}

.card p {
  color: #666;
  margin-bottom: 15px;
  font-size: 0.95rem;
}

.card-footer {
  color: #4b6cb7;
  font-weight: 600;
  display: inline-block;
  margin-top: 10px;
  text-decoration: none;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overview-header h2 {
  color: #182848;
  font-size: 1.6rem;
}

.overview-header .date {
  color: #666;
  font-size: 0.9rem;
}

.overview-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.overview-item {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9ff;
}

.item-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #4b6cb7;
  margin-bottom: 5px;
}

.item-label {
  color: #666;
  font-size: 0.9rem;
}

.notifications {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.notification {
  flex: 1;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-weight: 500;
  position: relative;
}

.notification.success {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
}

.notification.warning {
  background: linear-gradient(135deg, #ff9800, #e65100);
}

.notification-icon {
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  transition: all 0.2s;
}

.close-btn:hover {
  transform: rotate(90deg);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .overview-content {
    grid-template-columns: 1fr;
  }
}
</style>
