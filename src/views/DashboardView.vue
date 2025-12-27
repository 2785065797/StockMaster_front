<template>
  <div class="dashboard">
    <h1>欢迎使用库存管理系统</h1>
    <p>当前登录用户: {{ username }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
//import { useRoute } from 'vue-router'

// 从 localStorage 获取用户名
const username = computed(() => {
  const token = localStorage.getItem('token')
  // 实际项目中这里应该解析 token 获取用户名
  return token ? '管理员' : '未登录'
})
</script>

<style scoped>
.dashboard {
  text-align: center;
  padding: 40px;
}
</style>
