<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>协议管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
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
      </el-menu>
    </el-aside>
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Link, Document, Upload } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: white;
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
  background-color: rgba(255, 255, 255, 0.1);
}

.main-content {
  background-color: #f0f2f5;
  padding: 0;
}
</style>

