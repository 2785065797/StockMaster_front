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
axios.defaults.withCredentials = true
const isAutoLoginLoading = ref(true)
const router = useRouter()

// 自动登录逻辑
const autoLogin = async () => {
  try {
    console.log('autoLogin')
    // 调用后端自动登录接口
    const response = await axios.post('/api/user/auto-login', null, { withCredentials: true })

    if (response.data.code === 200) {
      // 跳转到主页
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  } catch {
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
  background: linear-gradient(135deg, #ffffff, #d4d7da);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: rgb(0, 0, 0);
}

.loading-spinner {
  border: 4px solid rgba(77, 166, 255, 0.3);
  border-top: 4px solid #4da6ff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 16px;
  letter-spacing: 0.5px;
  font-weight: 400;
  color: #333333;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  opacity: 0.95;
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
