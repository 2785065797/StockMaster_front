<template>
  <div id="app">
    <!-- 自动登录加载状态 -->
    <div v-if="isAutoLoginLoading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在验证登录状态...</p>
    </div>

    <!-- 登录页和主内容区域 -->
    <router-view v-if="!isAutoLoginLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// 自动登录状态
const isAutoLoginLoading = ref(true)
const router = useRouter()

// 自动登录逻辑
const autoLogin = async () => {
  const token = localStorage.getItem('token')

  // 无token直接跳转登录页
  if (!token) {
    isAutoLoginLoading.value = false
    return
  }

  try {
    // 调用后端自动登录接口
    const response = await axios.post('/api/auth/auto-login', null, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.data.code === 200) {
      // 跳转到主页
      router.push('/dashboard')
    } else {
      // token无效，清除存储
      localStorage.removeItem('token')
      router.push('/login')
    }
  } catch {
    localStorage.removeItem('token')
    router.push('/login')
  } finally {
    isAutoLoginLoading.value = false
  }
}

onMounted(() => {
  autoLogin()
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4a6fa5, #2a5298);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 18px;
  letter-spacing: 1px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
