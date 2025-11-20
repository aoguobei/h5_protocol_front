<template>
  <div class="protocol-list">
    <div class="header-actions">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文件名或协议标题"
        clearable
        style="width: 300px; margin-right: 12px;"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button v-if="hasEditPermission" type="primary" @click="handleCreate">
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
      empty-text="暂无数据"
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
          <el-button v-if="hasEditPermission" type="danger" size="small" @click="handleDelete(row.filename)">
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
        :total="sortedProtocolList.length"
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
import { Plus, Search } from '@element-plus/icons-vue'
import { getProtocolList, deleteProtocol } from '../api/protocol'
import {useUserStore} from "@/stores/user.js";

const router = useRouter()
const protocolList = ref([])
const filteredProtocolList = ref([]) // 搜索过滤后的列表
const sortedProtocolList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const sortConfig = ref({ prop: 'updateTime', order: 'descending' })
const searchKeyword = ref('')
const userStore = useUserStore()

// 检查用户是否有编辑权限
const hasEditPermission = computed(() => {
  return userStore.role === 'admin' || userStore.role === 'editor'
})

// 搜索过滤列表
const filterList = (list, keyword) => {
  if (!keyword || !keyword.trim()) {
    return list
  }

  const lowerKeyword = keyword.toLowerCase().trim()
 return list.filter(item => {
    const filename = (item.filename || '').toLowerCase()
    const title = (item.title || '').toLowerCase()
    return filename.includes(lowerKeyword) || title.includes(lowerKeyword)
  })
}

// 对列表进行排序
const sortList = (list, prop, order) => {
  // 过滤掉可能为undefined或null的项
  const validList = list.filter(item => item && typeof item === 'object');
  const sorted = [...validList]
 sorted.sort((a, b) => {
    // 确保a和b都是有效的对象
    if (!a || !b) {
      return 0;
    }
    let aVal = a[prop]
    let bVal = b[prop]

    // 根据属性类型选择适当的比较方法
    if (prop === 'size') {
      // 数值类型比较
      const numA = Number(aVal);
      const numB = Number(bVal);
      if (order === 'ascending') {
        return numA - numB;
      } else {
        return numB - numA;
      }
    } else {
      // 字符串类型比较（filename, title, updateTime等）
      if (order === 'ascending') {
        return String(aVal).localeCompare(String(bVal));
      } else {
        return String(bVal).localeCompare(String(aVal));
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
    // 确保返回的数据是数组，如果不是则使用空数组
    protocolList.value = Array.isArray(res.data) ? res.data : []
    // 应用搜索过滤
    applyFiltersAndSort()
  } catch (error) {
    console.error('获取协议列表失败:', error)
    ElMessage.error('获取协议列表失败')
    protocolList.value = [] // 出错时使用空数组
    applyFiltersAndSort()
  } finally {
    loading.value = false
 }
}

// 应用搜索过滤和排序
const applyFiltersAndSort = () => {
  // 先应用搜索过滤
  filteredProtocolList.value = filterList(protocolList.value, searchKeyword.value)
  // 再应用排序
  sortedProtocolList.value = sortList(
    filteredProtocolList.value,
    sortConfig.value.prop,
    sortConfig.value.order
  )
  // 搜索或过滤后重置到第一页
  currentPage.value = 1
}

// 处理搜索
const handleSearch = () => {
  applyFiltersAndSort()
}

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  if (!prop || !order) {
    // 如果没有排序，使用默认排序
    sortConfig.value = { prop: 'updateTime', order: 'descending' }
  } else {
    sortConfig.value = { prop, order }
  }

  // 重新排序（基于过滤后的列表）
  sortedProtocolList.value = sortList(
    filteredProtocolList.value,
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
  if (!hasEditPermission.value) {
    ElMessage.error('权限不足，无法删除协议')
    return
  }

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

    // 重新应用搜索过滤和排序
    applyFiltersAndSort()

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

  return Math.round((bytes / Math.pow(k, i)) * 10) / 100 + ' ' + sizes[i]
}

onMounted(async () => {
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
