<template>
  <div class="login-container">
    <div class="login-form">
      <h2>{{ isRegister ? '用户注册' : '协议管理系统登录' }}</h2>

      <!-- 登录表单 -->
      <el-form v-if="!isRegister" :model="loginForm" :rules="rules" ref="loginFormRef" label-width="0px">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            :loading="loading"
            size="large"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
        <el-form-item style="text-align: center;">
          <el-button type="text" @click="switchToRegister">还没有账号？立即注册</el-button>
        </el-form-item>
      </el-form>

      <!-- 注册表单 -->
      <el-form v-else :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="0px">
        <el-alert
          title="注册提示"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <div style="font-size: 13px; line-height: 1.6;">
            <div style="margin-bottom: 6px;">• 必须使用<strong>@fun.tv</strong>域名账号注册（如：zhangsan@fun.tv）</div>
            <div>• 密码要求：至少8位，包含大小写字母和数字</div>
          </div>
        </el-alert>
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            prefix-icon="Lock"
            size="large"
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleRegister"
            :loading="loading"
            size="large"
            style="width: 100%"
          >
            注册
          </el-button>
        </el-form-item>
        <el-form-item style="text-align: center;">
          <el-button type="text" @click="switchToLogin">已有账号？立即登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login as apiLogin, register as apiRegister } from '../api/auth'
import { useUserStore } from '../stores/user'

const router = useRouter()
const loginFormRef = ref()
const registerFormRef = ref()
const loading = ref(false)

const isRegister = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const registerForm = ref({
 username: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
 ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 密码复杂度验证
const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  if (value.length < 8) {
    callback(new Error('密码长度不能少于8位'))
    return
  }
  // 必须包含大写字母
  if (!/[A-Z]/.test(value)) {
    callback(new Error('密码必须包含至少一个大写字母'))
    return
  }
  // 必须包含小写字母
  if (!/[a-z]/.test(value)) {
    callback(new Error('密码必须包含至少一个小写字母'))
    return
  }
  // 必须包含数字
  if (!/[0-9]/.test(value)) {
    callback(new Error('密码必须包含至少一个数字'))
    return
  }
  callback()
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在3-50个字符之间', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value.endsWith('@fun.tv')) {
          callback(new Error('用户名必须以@fun.tv结尾'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    loading.value = true

    const res = await apiLogin({
      username: loginForm.value.username,
      password: loginForm.value.password
    })

    // 使用Pinia store来管理用户状态
    const userStore = useUserStore();
    if (res.data && res.data.user) {
      userStore.setUser(res.data.user);
    }

    ElMessage.success('登录成功')
    // 登录成功后跳转到协议列表页
    router.push('/protocols')
  } catch (error) {
    // 登录失败时使用store清除用户信息
    const userStore = useUserStore();
    userStore.clearUser();
    if (error && error.response && error.response.data && error.response.data.error) {
      ElMessage.error(error.response.data.error)
    } else if (error && error.message) {
      ElMessage.error(error.message || '登录失败')
    } else {
      ElMessage.error('登录失败，请检查用户名和密码')
    }
  } finally {
    loading.value = false
 }
}

const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
    loading.value = true

    await apiRegister({
      username: registerForm.value.username,
      password: registerForm.value.password
    })

    ElMessage.success('注册成功，请登录')
    // 注册成功后切换到登录界面
    isRegister.value = false
  } catch (error) {
    // 注册失败时使用store清除用户信息
    const userStore = useUserStore();
    userStore.clearUser();
    if (error && error.message) {
      ElMessage.error(error.message || '注册失败')
    } else {
      ElMessage.error('注册失败')
    }
  } finally {
    loading.value = false
 }
}

const switchToRegister = () => {
  isRegister.value = true
}

const switchToLogin = () => {
  isRegister.value = false
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  width: 400px;
 padding: 40px;
  background: white;
 border-radius: 8px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 500;
}
</style>
