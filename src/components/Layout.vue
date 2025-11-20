<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>协议管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        :router="true"
        class="sidebar-menu"
        :default-openeds="['1']"
      >
        <el-menu-item index="/link-generator">
          <el-icon><Link /></el-icon>
          <span>生成协议链接</span>
        </el-menu-item>
        <el-menu-item index="/protocols">
          <el-icon><Document /></el-icon>
          <span>协议管理</span>
        </el-menu-item>
        <el-menu-item index="/upload-compile">
          <el-icon><Upload /></el-icon>
          <span>编译上传</span>
        </el-menu-item>
        <!-- 管理员菜单项 -->
        <div v-if="userStore.role === 'admin'">
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/logs">
            <el-icon><Tickets /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
        </div>
      </el-menu>
      <!-- 用户信息和登出 -->
      <div class="user-panel">
        <el-dropdown @command="handleCommand" placement="top">
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人资料
              </el-dropdown-item>
              <el-dropdown-item command="role">
                <el-icon><Tickets /></el-icon>
                角色：{{ userStore.roleName }}
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
          <div class="user-info clickable-user-info">
            <div class="user-avatar">
              <el-icon><User /></el-icon>
            </div>
            <div class="user-details">
              <span class="username">{{ userStore.username }}</span>
            </div>
          </div>
        </el-dropdown>
      </div>
    </el-aside>
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Link, Document, Upload, User, Tickets, SwitchButton } from '@element-plus/icons-vue'
import { logout as apiLogout } from '../api/auth'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => {
  return route.path
})

// 在组件挂载时从localStorage恢复用户信息或获取用户信息
onMounted(async () => {
  // 首先尝试从localStorage恢复用户信息
  userStore.hydrateFromStorage()

  // 如果store中没有用户信息，则获取用户信息
  if (!userStore.user) {
    try {
      await userStore.fetchUser()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      router.push('/login')
    }
  }
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await apiLogout()
      ElMessage.success('已退出登录')
      userStore.clearUser()
      router.push('/login')
    } catch (error) {
      console.error('登出失败:', error)
      ElMessage.error('登出失败')
      userStore.clearUser()
      // 即使API调用失败，也跳转到登录页
      router.push('/login')
    }
  } else if (command === 'profile') {
    // 个人资料功能（可后续实现）
    ElMessage.info('个人资料功能待实现')
  } else if (command === 'role') {
    // 显示角色信息
    ElMessage.info(`当前角色：${userStore.roleName}`)
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: white;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
 align-items: center;
  padding-left: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  color: white;
  font-size: 18px;
 font-weight: 500;
  margin: 0;
  padding-left: 0;
}

.sidebar-menu {
  border-right: none;
 background-color: #304156;
  flex: 1;
}

/* 确保菜单项图标和文字的对齐方式一致 */
.sidebar-menu :deep(.el-menu-item) {
  padding-left: 20px !important;
 color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
 margin-right: 8px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #409eff;
  color: white;
}

.sidebar-menu :deep(.el-menu-item:hover) {
 background-color: rgba(255, 255, 25, 0.1);
}

.main-content {
  background-color: #f0f2f5;
  padding: 0;
}

.user-panel {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #263443;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-info {
  display: flex;
 align-items: center;
 gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
 transition: background-color 0.3s;
  cursor: pointer;
  width: 100%;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
 width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
 flex-shrink: 0;
}

.user-details {
  display: flex;
 flex-direction: column;
 flex: 1;
  min-width: 0; /* 允许内容收缩 */
}

.user-details .username {
  color: white;
  font-size: 14px;
 font-weight: 500;
 margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 为不同角色定义柔和的颜色 */
.role-tag {
 font-size: 10px;
  align-self: flex-start;
  border-radius: 12px;
 padding: 2px 8px;
  line-height: 1.2;
  font-weight: 500;
  text-align: center;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
 justify-content: center;
  margin-top: 4px;
  opacity: 0.9;
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.role-tag.admin {
  background-color: rgba(255, 107, 107, 0.2);
  border-color: rgba(255, 107, 107, 0.3);
}

.role-tag.editor {
  background-color: rgba(255, 182, 87, 0.2);
  border-color: rgba(255, 182, 87, 0.3);
}

.role-tag.viewer {
  background-color: rgba(100, 181, 246, 0.2);
  border-color: rgba(100, 181, 246, 0.3);
}

.role-tag.is-hit {
  border-color: inherit;
}
</style>
