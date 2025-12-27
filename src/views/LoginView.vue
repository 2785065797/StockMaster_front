<template>
  <div class="login-container">
    <!-- 背景图片 + 遮罩层 -->
    <div class="background-overlay"></div>

    <div class="login-box">
      <div class="login-header">
        <h2 class="login-title">库存管理系统</h2>
        <p class="login-subtitle">高效管理您的库存资产</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="el-icon-user"
            autofocus
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="密码"
            prefix-icon="el-icon-lock"
            type="password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="login-button" :loading="loading" native-type="submit">
            登录
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <el-link type="primary" @click="showForgot = true">忘记密码？</el-link>
          <el-link type="primary" @click="showRegister = true">注册账号</el-link>
        </div>
      </el-form>

      <!-- 忘记密码弹窗 -->
      <el-dialog title="重置密码" v-model="showForgot" width="400px" :close-on-click-modal="false">
        <el-form :model="forgotForm" :rules="forgotRules" ref="forgotFormRef">
          <el-form-item prop="email" label="邮箱">
            <el-input v-model="forgotForm.email" placeholder="请输入注册邮箱" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showForgot = false">取 消</el-button>
            <el-button type="primary" @click="handleForgot">确 定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 注册弹窗 -->
      <el-dialog
        title="注册新账号"
        v-model="showRegister"
        width="400px"
        :close-on-click-modal="false"
      >
        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef">
          <el-form-item prop="username" label="用户名">
            <el-input v-model="registerForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item prop="email" label="邮箱">
            <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item prop="password" label="密码">
            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showRegister = false">取 消</el-button>
            <el-button type="primary" @click="handleRegister">确 定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
})

const forgotForm = reactive({
  email: '',
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
})

// 表单状态
const loading = ref(false)
const showForgot = ref(false)
const showRegister = ref(false)

// 表单验证规则
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
}

const forgotRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
}

// 处理登录
const handleLogin = async () => {
  try {
    // 验证表单
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true

    // 调用后端接口
    const response = await axios.post('http://localhost:8080/auth/login', {
      username: loginForm.username,
      password: loginForm.password,
    })

    // 处理成功响应
    if (response.data.code === 200) {
      // 存储token
      localStorage.setItem('token', response.data.data.token)

      // 跳转到首页
      window.location.href = '/dashboard'
    } else {
      ElMessage.error(response.data.message || '登录失败')
    }
  } catch {
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 忘记密码
const handleForgot = () => {
  ElMessage.success('已发送重置邮件至您的邮箱')
  showForgot.value = false
}

// 注册账号
const handleRegister = () => {
  ElMessage.success('注册成功，请登录')
  showRegister.value = false
}

// 引用表单实例
const loginFormRef = ref()
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  padding: 20px;
  overflow: hidden;
}

/* 背景图片 */
.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/resources/login2.png') no-repeat center center fixed;
  background-size: cover;
  z-index: 0;
  opacity: 0.85;
}

/* 添加半透明遮罩确保文字清晰 */
.background-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.login-box {
  width: 400px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 45px;
  margin: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
}

.login-title {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-subtitle {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 25px;
  letter-spacing: 0.5px;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4a6fa5 0%, #2a5298 100%);
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(42, 82, 152, 0.4);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(42, 82, 152, 0.5);
}

.login-button:active {
  transform: translateY(0);
  box-shadow: 0 3px 10px rgba(42, 82, 152, 0.3);
}

.login-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 25px;
  font-size: 14px;
  color: #7f8c8d;
  text-align: center;
}

/* 增加按钮悬停效果 */
.el-button--primary {
  transition: all 0.3s ease;
}

.el-button--primary:hover {
  opacity: 0.9;
}
</style>
