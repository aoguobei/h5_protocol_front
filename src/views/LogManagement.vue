<template>
  <div class="log-management">
    <h2>操作日志</h2>
    
    <div class="filter-bar">
      <el-form :model="filters" inline>
        <el-form-item label="用户">
          <el-select 
            v-model="filters.userId" 
            placeholder="选择用户" 
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="filters.action"
            placeholder="选择操作类型"
            clearable
            style="width: 200px;"
          >
            <el-option label="创建协议" value="create_protocol" />
            <el-option label="更新协议" value="update_protocol" />
            <el-option label="删除协议" value="delete_protocol" />
            <el-option label="Git部署" value="git_deploy" />
            <el-option label="Git拉取" value="git_pull" />
            <el-option label="更新用户角色" value="update_user_role" />
            <el-option label="删除用户" value="delete_user" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table 
      :data="logList" 
      v-loading="loading" 
      stripe 
      style="width: 100%"
      empty-text="暂无数据"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="action" label="操作类型" width="150">
        <template #default="{ row }">
          {{ getActionLabel(row.action) }}
        </template>
      </el-table-column>
      <el-table-column prop="resource_type" label="资源类型" width="120" />
      <el-table-column prop="resource_name" label="资源名称" min-width="200" />
      <el-table-column prop="created_at" label="操作时间" width="180" />
      <el-table-column label="详情" min-width="200">
        <template #default="{ row }">
          <el-popover
            placement="top-start"
            :title="'操作详情'"
            :width="400"
            trigger="hover"
            :content="row.details || '无详情'"
          >
            <template #reference>
              <el-button size="small">查看</el-button>
            </template>
          </el-popover>
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
import { getLogList as fetchLogList } from '../api/log'
import { getUserList as fetchUserList } from '../api/user'

const logList = ref([])
const userList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(0)

const filters = ref({
 userId: '',
  action: ''
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filters.value
    }
    
    const response = await fetchLogList(params)
    logList.value = response.data.logs
    total.value = response.data.pagination.total
  } catch (error) {
    console.error('获取日志列表失败:', error)
 } finally {
    loading.value = false
 }
}

const fetchUsers = async () => {
  try {
    const response = await fetchUserList({ params: { limit: 100 } })
    userList.value = response.data.users
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const getActionLabel = (action) => {
  switch (action) {
    case 'create_protocol': return '创建协议'
    case 'update_protocol': return '更新协议'
    case 'delete_protocol': return '删除协议'
    case 'git_deploy': return 'Git部署'
    case 'git_pull': return 'Git拉取'
    case 'update_user_role': return '更新用户角色'
    case 'delete_user': return '删除用户'
    default: return action
 }
}

const resetFilters = () => {
  filters.value = {
    userId: '',
    action: ''
 }
  fetchLogs()
}

const handleSizeChange = (val) => {
 pageSize.value = val
  fetchLogs()
}

const handleCurrentChange = (val) => {
 currentPage.value = val
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
  fetchUsers()
})
</script>

<style scoped>
.log-management {
  padding: 20px;
}

.log-management h2 {
  margin-bottom: 20px;
}

.filter-bar {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.filter-bar .el-form-item {
  margin-right: 20px;
  margin-bottom: 0;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
 justify-content: flex-end;
}
</style>
