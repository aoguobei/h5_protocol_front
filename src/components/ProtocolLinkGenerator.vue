<template>
  <div class="link-generator-container">
    <!-- 顶部说明 -->
    <div class="top-tips">
      <div class="tips-text">通用协议：公共内容统一管理，个性化信息通过参数配置，一键生成专属链接</div>
      <div class="tips-text" style="margin-top: 4px;">选择协议类型 → 选择协议 → 填写参数 → 生成链接</div>
      <div class="tips-text" style="margin-top: 4px; color: #67c23a;">✨ 提示：生成协议链接时，不必限制协议类型，若协议内容合适也可以用其他类型的通用协议（如：影视/小说都使用了ysp_agreement.html）</div>
    </div>

    <el-card class="link-generator-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab 1: 快速生成 -->
        <el-tab-pane name="generate">
          <template #label>
            <span class="tab-label">
              <el-icon><Link /></el-icon>
              <span>快速生成</span>
            </span>
          </template>

    <el-form :model="form" label-width="100px" v-loading="loading" class="generate-form">
      <el-form-item label="协议类型" required>
        <el-radio-group v-model="form.appType" @change="handleAppTypeChange">
          <el-radio
            v-for="type in appTypes"
            :key="type"
            :value="type"
          >
            {{ type }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="选择协议" required>
        <el-select
          v-model="form.selectedProtocol"
          placeholder="请先选择协议类型"
          style="width: 100%"
          @change="handleProtocolChange"
          :disabled="!form.appType"
          clearable
        >
          <el-option
            v-for="protocol in currentProtocols"
            :key="protocol.filename"
            :label="formatProtocolLabel(protocol)"
            :value="protocol.filename"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="域名选择" required>
        <el-select v-model="form.domain" placeholder="请选择域名" style="width: 100%">
          <el-option label="mp.fun.tv（默认）" value="mp.fun.tv"/>
          <el-option label="mp.xyhvip.cn（享悦荟）" value="mp.xyhvip.cn" />
        </el-select>
      </el-form-item>

      <!-- 动态渲染字段 -->
      <el-divider content-position="left" v-if="currentFields.length > 0" class="params-divider">
        <el-icon><Edit /></el-icon>
        <span style="margin-left: 4px;">协议参数</span>
      </el-divider>
      <DynamicFormFields
        v-if="currentFields.length > 0"
        :fields="currentFields"
        v-model="form.params"
        :required-checker="isFieldRequired"
      />

      <el-form-item>
        <el-button
          type="primary"
          @click="generateLink"
          :disabled="!form.selectedProtocol"
          size="large"
          style="width: 140px;"
        >
          <el-icon><Link /></el-icon>
          <span>生成链接</span>
        </el-button>
        <el-button @click="resetForm" size="large">重置</el-button>
      </el-form-item>

      <el-divider content-position="left" v-if="generatedLink">
        <el-icon><SuccessFilled /></el-icon>
        <span style="margin-left: 4px;">生成结果</span>
      </el-divider>
      <el-form-item v-if="generatedLink">
        <el-input
          v-model="generatedLink"
          type="textarea"
          :rows="4"
          readonly
          class="result-textarea"
        />
        <div class="result-actions">
          <el-button type="success" @click="copyLink" :icon="CopyDocument">
            复制链接
          </el-button>
          <el-button @click="openLink" :icon="View">
            在新窗口打开
          </el-button>
        </div>
      </el-form-item>
    </el-form>
        </el-tab-pane>

        <!-- Tab 2: 历史记录 -->
        <el-tab-pane name="history">
          <template #label>
            <span class="tab-label">
              <el-icon><Clock /></el-icon>
              <span>历史记录</span>
            </span>
          </template>
          <div v-if="linkHistory.length === 0" style="text-align: center; padding: 40px; color: #909399;">
            <el-icon :size="48" style="margin-bottom: 16px;"><Document /></el-icon>
            <div>暂无历史记录</div>
          </div>
          <div v-else>
            <el-table :data="paginatedHistory" stripe style="width: 100%">
              <el-table-column type="index" label="" width="40" :index="getTableIndex" />
              <el-table-column prop="protocol" label="协议" width="200" show-overflow-tooltip />
              <el-table-column prop="link" label="链接" show-overflow-tooltip />
              <el-table-column prop="createdAt" label="生成时间" width="160" show-overflow-tooltip />
              <el-table-column label="操作" width="140" fixed="right">
                <template #default="{ $index }">
                  <el-button type="primary" size="small" @click="copyHistoryLink(paginatedHistory[$index].link)">复制</el-button>
                  <el-button type="danger" size="small" @click="deleteHistoryItem((currentPage - 1) * pageSize + $index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="linkHistory.length"
              layout="total, prev, pager, next"
              style="margin-top: 16px; justify-content: center;"
            />
          </div>
        </el-tab-pane>

        <!-- Tab 3: 编辑通用协议 -->
        <el-tab-pane name="edit">
          <template #label>
            <span class="tab-label">
              <el-icon><EditPen /></el-icon>
              <span>编辑通用协议</span>
            </span>
          </template>
          <div>
            <div class="edit-tips">
              <div class="tips-text">⚠️ 编辑提示：修改协议内容前，请确认所有引用该协议的应用都需要同步更新，特别是<span style="color: #409eff; font-weight: 600;">通用</span>协议会影响多个应用</div>
            </div>
            <el-table :data="commonProtocols" stripe style="width: 100%">
              <el-table-column prop="filename" label="文件名" width="250" show-overflow-tooltip />
              <el-table-column prop="app_type" label="应用类型" width="120" show-overflow-tooltip />
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="editProtocol(row.filename)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  InfoFilled,
  Link,
  Edit,
  SuccessFilled,
  CopyDocument,
  View,
  Clock,
  EditPen
} from '@element-plus/icons-vue'
import { getProtocolList } from '../api/protocol'
import { getProtocolConfig, getNestedValue, setNestedValue } from '@/config/protocolParams'
import DynamicFormFields from './DynamicFormFields.vue'

const router = useRouter()
const loading = ref(false)
const allProtocols = ref([])
const commonProtocols = ref([])
const activeTab = ref('generate')
const linkHistory = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return linkHistory.value.slice(start, end)
})

const getTableIndex = (index) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

const form = ref({
  appType: '',
  selectedProtocol: '',
  domain: 'mp.fun.tv',
  params: {}
})

const generatedLink = ref('')

const loadHistory = () => {
  try {
    const history = localStorage.getItem('protocolLinkHistory')
    if (history) {
      linkHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

const saveHistory = () => {
  try {
    localStorage.setItem('protocolLinkHistory', JSON.stringify(linkHistory.value))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

const addToHistory = (link, protocolName) => {
  const historyItem = {
    protocol: protocolName,
    link: link,
    createdAt: new Date().toLocaleString('zh-CN')
  }
  linkHistory.value.unshift(historyItem)
  if (linkHistory.value.length > 30) {
    linkHistory.value = linkHistory.value.slice(0, 30)
  }
  saveHistory()
}

const appTypes = computed(() => {
  const protocolsWithConfig = commonProtocols.value.filter(p => getProtocolConfig(p.filename))
  const types = [...new Set(protocolsWithConfig.map(p => p.app_type))].filter(Boolean)
  return types.sort()
})

const currentProtocols = computed(() => {
  if (!form.value.appType) return []
  return commonProtocols.value.filter(p => p.app_type === form.value.appType && getProtocolConfig(p.filename))
})

const currentFields = computed(() => {
  if (!form.value.selectedProtocol) return []
  const config = getProtocolConfig(form.value.selectedProtocol)
  return config?.fields || []
})

const fetchProtocols = async () => {
  loading.value = true
  try {
    const res = await getProtocolList()
    allProtocols.value = res.data
    commonProtocols.value = res.data.filter(p => p.app_name === '通用')

    if (appTypes.value.length > 0) {
      form.value.appType = appTypes.value[0]
    }
  } catch (error) {
    console.error('获取协议列表失败:', error)
    ElMessage.error('获取协议列表失败')
  } finally {
    loading.value = false
  }
}

const formatProtocolLabel = (protocol) => {
  const filename = protocol.filename.replace('.html', '')
  if (protocol.description) {
    return `${filename}（${protocol.description}）`
  }
  return filename
}

const isFieldRequired = (key) => {
  if (form.value.selectedProtocol === 'ysp_agreement.html') {
    return !key.startsWith('historyVersion')
  }
  return true
}

const handleAppTypeChange = () => {
  form.value.selectedProtocol = ''
  form.value.params = {}
  generatedLink.value = ''
}

const handleProtocolChange = () => {
  const config = getProtocolConfig(form.value.selectedProtocol)
  if (config) {
    const params = {}
    config.fields.forEach(field => {
      setNestedValue(params, field.key, '')
    })
    form.value.params = params
  }
  generatedLink.value = ''
}

const generateLink = () => {
  if (!form.value.selectedProtocol) {
    ElMessage.warning('请选择协议')
    return
  }

  const protocol = currentProtocols.value.find(p => p.filename === form.value.selectedProtocol)
  if (!protocol) {
    ElMessage.error('协议不存在')
    return
  }

  const protocolConfig = getProtocolConfig(form.value.selectedProtocol)
  if (!protocolConfig) {
    ElMessage.error('协议配置不存在')
    return
  }

  const requiredFields = protocolConfig.fields.filter(field => isFieldRequired(field.key))
  for (const field of requiredFields) {
    const value = getNestedValue(form.value.params, field.key)
    if (!value) {
      ElMessage.warning(`请输入${field.label}`)
      return
    }
  }

  const domain = form.value.domain
  const filename = form.value.selectedProtocol.replace('.html', '')
  const baseUrl = `https://${domain}/static/notice/${filename}.html`

  const config = {}
  protocolConfig.fields.forEach(field => {
    const value = getNestedValue(form.value.params, field.key)
    if (value) {
      setNestedValue(config, field.key, value)
    }
  })

  if (protocolConfig.useQueryParams) {
    const queryParams = new URLSearchParams()
    Object.entries(config).forEach(([key, value]) => {
      queryParams.append(key, value)
    })
    generatedLink.value = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl
  } else {
    const paramConfig = encodeURIComponent(JSON.stringify(config))
    generatedLink.value = `${baseUrl}?paramConfig=${paramConfig}`
  }

  const protocolName = formatProtocolLabel(protocol)
  addToHistory(generatedLink.value, protocolName)
}

const copyLink = () => {
  if (!generatedLink.value) {
    ElMessage.warning('没有可复制的链接')
    return
  }

  navigator.clipboard.writeText(generatedLink.value).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    const textarea = document.createElement('textarea')
    textarea.value = generatedLink.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('链接已复制到剪贴板')
  })
}

const openLink = () => {
  if (generatedLink.value) {
    window.open(generatedLink.value, '_blank')
  }
}

const resetForm = () => {
  form.value.selectedProtocol = ''
  form.value.params = {}
  generatedLink.value = ''
}

const copyHistoryLink = (link) => {
  navigator.clipboard.writeText(link).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    const textarea = document.createElement('textarea')
    textarea.value = link
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('链接已复制到剪贴板')
  })
}

const deleteHistoryItem = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除这条历史记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    linkHistory.value.splice(index, 1)
    saveHistory()
    ElMessage.success('删除成功')

    // 如果当前页没有数据了，回到上一页
    const maxPage = Math.ceil(linkHistory.value.length / pageSize.value)
    if (currentPage.value > maxPage && maxPage > 0) {
      currentPage.value = maxPage
    }
  } catch {
    // 用户取消
  }
}

const editProtocol = (filename) => {
  router.push(`/edit/${encodeURIComponent(filename)}`)
}

onMounted(() => {
  fetchProtocols()
  loadHistory()
})
</script>

<style scoped>
.link-generator-container {
  /* padding: 20px; */
}

.top-tips {
  padding: 8px 16px;
  margin-bottom: 16px;
  background-color: #fdf6ec;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;
}

.tips-text {
  color: #606266;
  font-size: 13px;
}

.link-generator-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.link-generator-card :deep(.el-card__body) {
  padding: 0;
}

.link-generator-card :deep(.el-tabs__content) {
  padding: 24px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.generate-form {
  max-width: 800px;
}



.result-textarea {
  margin-bottom: 12px;
}

.result-textarea :deep(textarea) {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background-color: #f5f7fa;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.params-divider :deep(.el-divider__text) {
  color: #409eff;
}

.params-divider :deep(.el-icon) {
  color: #409eff;
}

.edit-tips {
  margin-bottom: 16px;
  padding: 8px 16px;
  background-color: #fef0f0;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.edit-tips .tips-text {
  color: #606266;
  font-size: 13px;
}
</style>
