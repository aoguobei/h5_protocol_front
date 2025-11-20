<template>
  <div class="user-management">
    <h2>用户管理</h2>

    <el-table
      :data="userList"
      v-loading="loading"
      stripe
      style="width: 100%"
      empty-text="暂无数据"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="100" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag
            :type="getRoleTagType(row.role)"
            v-if="row.id !== userStore.currentUser?.id"
          >
            {{ getRoleText(row.role) }}
          </el-tag>
          <el-tag
            :type="getRoleTagType(row.role)"
            v-else
          >
            {{ getRoleText(row.role) }} (当前)
          </el-tag>
        </template>
      </el-table-column>
<!--      <el-table-column prop="updatedAt" label="更新时间" width="200" />-->
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <div class="operation-buttons">
            <el-select
              v-if="row.id !== userStore.currentUser?.id"
              v-model="row.role"
              placeholder="选择角色"
              size="small"
              @change="handleRoleChange(row.id, row.role)"
              :disabled="updatingUserId === row.id"
              class="role-select"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="编辑者" value="editor" />
              <el-option label="查看者" value="viewer" />
            </el-select>
            <el-select
              v-else
              v-model="row.role"
              placeholder="选择角色"
              size="small"
              @change="handleRoleChange(row.id, row.role)"
              :disabled="true"
              class="role-select"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="编辑者" value="editor" />
              <el-option label="查看者" value="viewer" />
            </el-select>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteUser(row.id)"
              :disabled="row.id === userStore.currentUser?.id"
              :icon="Delete"
              class="delete-btn"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { getUserList, updateUserRole, deleteUser } from '../api/user'
import { useUserStore } from '../stores/user'

const userList = ref([])
const loading = ref(false)
const updatingUserId = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 监听store中用户的变化
const userStore = useUserStore();

const fetchUserList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    const response = await getUserList({ params })
    userList.value = response.data.users
    total.value = response.data.pagination.total
 } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
 }
}

const handleRoleChange = async (userId, newRole) => {
  updatingUserId.value = userId
 try {
    await updateUserRole(userId, { role: newRole })
    ElMessage.success('用户角色更新成功')
    // 重新加载用户列表
    fetchUserList()
  } catch (error) {
    ElMessage.error('更新用户角色失败')
    // 恢复原来的值
    fetchUserList()
  } finally {
    updatingUserId.value = null
  }
}

const handleDeleteUser = async (userId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该用户吗？此操作不可恢复！',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteUser(userId)
    ElMessage.success('用户删除成功')

    // 重新加载用户列表
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除用户失败')
    }
  }
}

const getRoleText = (role) => {
  switch (role) {
    case 'admin': return '管理员'
    case 'editor': return '编辑者'
    case 'viewer': return '查看者'
    default: return role
 }
}

const getRoleTagType = (role) => {
  switch (role) {
    case 'admin': return 'danger'
    case 'editor': return 'primary'
    case 'viewer': return 'info'
    default: return 'info'
  }
}

const handleSizeChange = (val) => {
 pageSize.value = val
 fetchUserList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
 fetchUserList()
}

onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.user-management h2 {
  margin-bottom: 20px;
}

.operation-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-select {
  min-width: 100px;
}

.no-action {
  display: inline-block;
  width: 100px;
  text-align: center;
 color: #999;
}

.delete-btn {
  margin-left: 0 !important;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
