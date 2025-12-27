<script setup lang="ts">
import { defineComponent } from 'vue'

defineComponent({
  name: 'App',
})
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>
