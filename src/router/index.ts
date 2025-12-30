import axios from 'axios'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('../views/InventoryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('../views/ProductsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('../views/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('../views/ReportsView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫：检查登录状态
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  if (requiresAuth) {
    try {
      const response = await axios.get('/api/auth/status', { withCredentials: true })
      if (response.data.code === 200) {
        next()
      } else {
        next('/login')
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      next('/login')
    }
  } else {
    next()
  }
})

export default router
