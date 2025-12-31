<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-left">
        <button v-if="showBack" class="back-btn" @click="goBack" aria-label="返回">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M19 12H5M12 19L5 12L12 5"></path>
          </svg>
        </button>

        <div class="header-logo" @click="goHome" role="button" aria-label="首页">
          <div class="logo-icon">📦</div>
          <h1 class="logo-title">{{ title }}</h1>
        </div>
      </div>

      <div class="header-center">
        <slot />
      </div>

      <div class="header-right">
        <span class="welcome">欢迎，{{ username }}</span>
        <button v-if="showLogout" class="logout-btn" @click="handleLogout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m4 12V3a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3z"
            ></path>
          </svg>
          <span class="logout-text">退出</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: 'StockMaster' },
  showLogo: { type: Boolean, default: true },
  showLogout: { type: Boolean, default: true },
  showBack: { type: Boolean, default: false },
  userKey: { type: String, default: 'currentUser' },
  redirectAfterLogout: { type: Boolean, default: true },
})

const router = useRouter()

const username = computed(() => {
  try {
    const raw = localStorage.getItem(props.userKey)
    if (!raw) return '管理员'
    const parsed = JSON.parse(raw)
    return parsed?.username ?? parsed?.name ?? '管理员'
  } catch {
    return '管理员'
  }
})

const handleLogout = async () => {
  try {
    // 调用后端接口
    const response = await axios.post('/api/user/logout', { withCredentials: true })

    // 处理成功响应
    if (response.data.code === 200) {
      ElMessage.success('ログアウト成功')
      console.log('ログアウト成功！')
      //router.push('/login')
    } else {
      ElMessage.error(response.data.message || 'ログアウト失敗！')
    }
  } catch {
    ElMessage.error('ネットワークエラー、再試行してください')
  } finally {
    localStorage.removeItem(props.userKey)
    router.push('/login')
  }
}

const goHome = () => {
  router.push('/dashboard')
}
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logo-icon {
  font-size: 2.2rem;
  background: rgba(255, 255, 255, 0.15);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.logo-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome {
  font-size: 1.05rem;
  font-weight: 500;
  opacity: 0.9;
  transition: all 0.2s ease;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  padding: 8px 16px;
  border-radius: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.95rem;
  color: white;
  white-space: nowrap;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.logout-btn:active {
  transform: translateY(0);
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.8;
}

.back-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .header-container {
    padding: 12px 16px;
  }

  .logo-title {
    font-size: 1.3rem;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    font-size: 1.8rem;
  }

  .welcome {
    font-size: 0.95rem;
  }

  .logout-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}
</style>
