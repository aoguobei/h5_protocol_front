<template>
  <div class="protocol-list">
    <!-- 顶部提示 -->
    <div class="top-tips">
      <div class="tips-text">⚠️ 编辑提示：修改协议内容前，请确认所有引用该协议的应用都需要同步更新，特别是<span style="color: #409eff; font-weight: 600;">通用</span>协议会影响多个应用</div>
      <div class="tips-text" style="margin-top: 4px;">✨ 新建提示：若现有通用协议内容适用，建议直接使用通用协议生成链接，无需重复创建</div>
    </div>

    <div class="header-actions">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文件名、应用类型或应用名称"
        clearable
        style="width: 300px; margin-right: 12px;"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="selectedAppTypes"
        placeholder="筛选应用类型"
        clearable
        multiple
        collapse-tags
        style="width: 200px; margin-right: 12px;"
        @change="handleSearch"
      >
        <el-option
          v-for="item in appTypeOptions"
          :key="item.value"
          :label="item.text"
          :value="item.value"
        />
      </el-select>
      <el-select
        v-model="selectedAppNames"
        placeholder="筛选应用名称"
        clearable
        multiple
        collapse-tags
        style="width: 200px; margin-right: 12px;"
        @change="handleSearch"
      >
        <el-option
          v-for="item in appNameOptions"
          :key="item.value"
          :label="item.text"
          :value="item.value"
        />
      </el-select>
      <div style="flex: 1;"></div>
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
      <el-table-column prop="filename" label="文件名" min-width="160" sortable show-overflow-tooltip />
      <!-- <el-table-column prop="title" label="协议标题" min-width="150">
        <template #default="{ row }">
          <span :title="row.title || '无标题'">{{ row.title || '-' }}</span>
        </template>
      </el-table-column> -->
      <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.description || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="app_type" label="应用类型" width="120" sortable show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.app_type || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="app_name" label="应用名称" width="140" sortable show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.app_name === '通用'" style="color: #409eff;">通用</span>
          <span v-else>{{ row.app_name || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="size" label="文件大小" width="100">
        <template #default="{ row }">
          {{ formatFileSize(row.size) }}
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="160" sortable show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="success"
            size="small" 
            @click="handleCopyLink(row.filename)"
            :disabled="row.app_name === '通用'"
          >
            复制
          </el-button>
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

// 筛选选项
const appTypeOptions = ref([])
const appNameOptions = ref([])
const selectedAppTypes = ref([]) // 已选择的应用类型
const selectedAppNames = ref([]) // 已选择的应用名称

// 检查用户是否有编辑权限
const hasEditPermission = computed(() => {
  return userStore.role === 'admin' || userStore.role === 'editor'
})

// 搜索过滤列表
const filterList = (list, keyword, appTypes, appNames) => {
  let result = list
  
  // 应用关键词搜索
  if (keyword && keyword.trim()) {
    const lowerKeyword = keyword.toLowerCase().trim()
    result = result.filter(item => {
      const filename = (item.filename || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      const appType = (item.app_type || '').toLowerCase()
      const appName = (item.app_name || '').toLowerCase()
      return filename.includes(lowerKeyword) || 
             description.includes(lowerKeyword) ||
             appType.includes(lowerKeyword) ||
             appName.includes(lowerKeyword)
    })
  }
  
  // 应用类型筛选
  if (appTypes && appTypes.length > 0) {
    result = result.filter(item => appTypes.includes(item.app_type))
  }
  
  // 应用名称筛选
  if (appNames && appNames.length > 0) {
    result = result.filter(item => appNames.includes(item.app_name))
  }
  
  return result
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
    
    // 生成筛选选项
    generateFilterOptions()
    
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

// 生成筛选选项
const generateFilterOptions = () => {
  const appTypes = new Set()
  const appNames = new Set()
  
  protocolList.value.forEach(item => {
    if (item.app_type) appTypes.add(item.app_type)
    if (item.app_name) appNames.add(item.app_name)
  })
  
  appTypeOptions.value = Array.from(appTypes).map(type => ({
    text: type,
    value: type
  }))
  
  appNameOptions.value = Array.from(appNames).map(name => ({
    text: name,
    value: name
  }))
}

// 应用搜索过滤和排序
const applyFiltersAndSort = () => {
  // 先应用搜索和筛选
  filteredProtocolList.value = filterList(
    protocolList.value, 
    searchKeyword.value,
    selectedAppTypes.value,
    selectedAppNames.value
  )
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

const handleCopyLink = async (filename) => {
  let domain
  try {
    await ElMessageBox.confirm(
      '请选择域名',
      '复制链接',
      {
        confirmButtonText: 'mp.fun.tv（默认）',
        cancelButtonText: 'mp.xyhvip.cn（享悦荟）',
        distinguishCancelAndClose: true,
        type: 'info',
        confirmButtonClass: 'el-button--default'
      }
    )
    domain = 'mp.fun.tv'
  } catch (action) {
    if (action === 'cancel') {
      domain = 'mp.xyhvip.cn'
    } else {
      return
    }
  }

  const link = `https://${domain}/static/notice/${filename}`
  
  try {
    await navigator.clipboard.writeText(link)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = link
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('链接已复制到剪贴板')
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
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

.top-tips {
  margin-bottom: 16px;
  padding: 8px 16px;
  background-color: #fef0f0;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.tips-text {
  color: #606266;
  font-size: 13px;
}

.header-actions {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
