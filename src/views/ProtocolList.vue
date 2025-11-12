<template>
  <div class="protocol-list">
    <div class="header-actions">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建协议
      </el-button>
    </div>

    <el-table 
      :data="paginatedList" 
      v-loading="loading" 
      stripe 
      style="width: 100%" 
      :default-sort="{ prop: 'updateTime', order: 'descending' }"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="filename" label="文件名" min-width="200" sortable />
      <el-table-column prop="title" label="协议标题" min-width="200">
        <template #default="{ row }">
          <span :title="row.title || '无标题'">{{ row.title || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="size" label="文件大小" width="120">
        <template #default="{ row }">
          {{ formatFileSize(row.size) }}
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="180" sortable />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row.filename)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row.filename)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="protocolList.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getProtocolList, deleteProtocol } from '../api/protocol'

const router = useRouter()
const protocolList = ref([])
const sortedProtocolList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const sortConfig = ref({ prop: 'updateTime', order: 'descending' })

// 对列表进行排序
const sortList = (list, prop, order) => {
  const sorted = [...list]
  sorted.sort((a, b) => {
    let aVal = a[prop]
    let bVal = b[prop]
    
    // 处理字符串比较（文件名和更新时间）
    if (prop === 'filename' || prop === 'updateTime') {
      if (order === 'ascending') {
        return aVal.localeCompare(bVal)
      } else {
        return bVal.localeCompare(aVal)
      }
    }
    
    // 处理数字比较（文件大小）
    if (prop === 'size') {
      if (order === 'ascending') {
        return aVal - bVal
      } else {
        return bVal - aVal
      }
    }
    
    return 0
  })
  return sorted
}

// 计算分页后的列表
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedProtocolList.value.slice(start, end)
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getProtocolList()
    protocolList.value = res.data
    // 应用当前排序
    sortedProtocolList.value = sortList(
      protocolList.value,
      sortConfig.value.prop,
      sortConfig.value.order
    )
  } catch (error) {
    ElMessage.error('获取协议列表失败')
  } finally {
    loading.value = false
  }
}

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  if (!prop || !order) {
    // 如果没有排序，使用默认排序
    sortConfig.value = { prop: 'updateTime', order: 'descending' }
  } else {
    sortConfig.value = { prop, order }
  }
  
  // 重新排序
  sortedProtocolList.value = sortList(
    protocolList.value,
    sortConfig.value.prop,
    sortConfig.value.order
  )
  
  // 排序后重置到第一页
  currentPage.value = 1
}

const handleCreate = () => {
  router.push('/edit')
}

const handleEdit = (filename) => {
  router.push(`/edit/${filename}`)
}

const handleDelete = async (filename) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除协议文件 "${filename}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteProtocol(filename)
    ElMessage.success('删除成功')
    
    // 从列表中移除已删除的项
    protocolList.value = protocolList.value.filter(item => item.filename !== filename)
    
    // 重新应用排序
    sortedProtocolList.value = sortList(
      protocolList.value,
      sortConfig.value.prop,
      sortConfig.value.order
    )
    
    // 如果当前页没有数据了，跳转到上一页
    if (paginatedList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 改变每页显示数量时，重置到第一页
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.protocol-list {
  padding: 20px;
  min-height: 100vh;
}

.header-actions {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

