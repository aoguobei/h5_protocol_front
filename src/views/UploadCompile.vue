<template>
  <div class="upload-compile">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Tab 1: 拉取代码 -->
        <el-tab-pane label="拉取代码" name="pull">
          <div class="tab-content">
            <div class="section-header">
              <div class="section-title">Git 状态</div>
              <el-button @click="fetchPullData" :loading="loadingPullData" size="small">
                刷新
              </el-button>
            </div>

            <!-- Git 状态 -->
            <div class="git-status-wrapper" style="margin-bottom: 20px;">
              <GitStatusPanel :git-status="gitStatus" :branch-status="branchStatus" />
              <!-- 拉取按钮区域 -->
              <div style="margin-top: 15px;">
                <el-button
                  type="primary"
                  @click="handlePull"
                  :loading="pulling"
                  :disabled="!gitStatus.is_clean"
                  size="small"
                >
                  <el-icon><Download /></el-icon>
                  拉取最新代码
                </el-button>
                <span v-if="!gitStatus.is_clean" style="margin-left: 8px; color: #e6a23c; font-size: 12px;">
                  工作区有变更时不允许拉取
                </span>
              </div>
            </div>

            <!-- 提交历史（分页） -->
            <div style="margin-top: 20px;">
              <div class="section-title">最近提交记录</div>
            </div>
            <el-table :data="paginatedLog" stripe style="width: 100%" v-loading="loadingLog">
              <el-table-column prop="hash" label="提交哈希" width="100" />
              <el-table-column prop="author" label="作者" width="120" />
              <el-table-column prop="date" label="日期" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.date) }}
                </template>
              </el-table-column>
              <el-table-column prop="message" label="提交信息" />
            </el-table>
            <div class="pagination-wrapper" style="margin-top: 15px; display: flex; justify-content: flex-end;" v-if="gitLog.length > 5">
              <el-pagination
                v-model:current-page="logCurrentPage"
                :page-size="5"
                :total="gitLog.length"
                layout="prev, pager, next"
                size="small"
              />
            </div>

          </div>
        </el-tab-pane>

        <!-- Tab 2: 上传代码 -->
        <el-tab-pane label="上传代码" name="deploy">
          <div class="tab-content">
            <div class="section-header">
              <div class="section-title">提交部署</div>
              <el-button @click="fetchStatus" :loading="loadingStatus" size="small">
                刷新状态
              </el-button>
            </div>

            <!-- Git 状态信息 -->
            <div class="git-status-wrapper" style="margin-bottom: 20px;">
              <GitStatusPanel :git-status="gitStatus" :branch-status="branchStatus" />
            </div>

            <!-- 提交区域 -->
            <div class="commit-section">
              <el-form :model="commitForm" label-width="100px">
                <el-form-item label="提交信息" required>
                  <el-input
                    v-model="commitForm.message"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入提交信息"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    v-if="hasEditPermission"
                    type="primary"
                    @click="handleDeploy"
                    :loading="deploying"
                    :disabled="!commitForm.message || gitStatus.is_clean || (branchStatus.has_remote && branchStatus.behind > 0)"
                  >
                    {{ deploying ? '部署中...' : '提交并部署' }}
                  </el-button>
                  <span v-if="gitStatus.is_clean" style="margin-left: 10px; color: #909399; font-size: 12px;">
                    工作区干净时无需提交
                  </span>
                  <span v-if="branchStatus.has_remote && branchStatus.behind > 0" style="margin-left: 10px; color: #f56c6c; font-size: 12px;">
                    落后远程 {{ branchStatus.behind }} 个提交，请先拉取最新代码
                  </span>
                </el-form-item>
              </el-form>
            </div>

            <!-- 部署步骤 -->
            <div v-if="deploySteps.length > 0" class="deploy-steps" style="margin-top: 20px;">
              <div class="section-title">部署步骤</div>
              <el-timeline>
                <el-timeline-item
                  v-for="(step, index) in deploySteps"
                  :key="index"
                  :timestamp="step.step"
                  :type="step.status === 'success' ? 'success' : step.status === 'warning' ? 'warning' : step.status === 'skipped' ? 'info' : 'danger'"
                  placement="top"
                >
                  <el-card>
                    <div class="step-output">
                      <pre v-if="step.output && step.output.trim()" class="console-output">{{ step.output }}</pre>
                      <span v-else class="no-output">{{ step.step }} - 无输出</span>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: 发布上线 -->
        <el-tab-pane label="发布上线" name="release">
          <div class="tab-content">
            <div class="section-title" style="font-size: 15px; margin-bottom: 12px;">生产环境发布</div>

            <el-alert
              type="warning"
              :closable="false"
              style="margin-bottom: 15px; font-size: 12px;"
              class="small-title-alert"
            >
              <template #default>
                <div style="font-size: 13px;">生产环境发布需要运维人员协助操作，请确保代码已完成测试并推送到远程仓库</div>
              </template>
            </el-alert>

            <div class="release-info">
              <el-card class="contact-card">
                <template #header>
                  <div class="card-header">
                    <span>运维联系方式</span>
                  </div>
                </template>
                <div class="contact-content">
                  <div class="contact-item">
                    <el-icon class="contact-icon"><User /></el-icon>
                    <span class="contact-label">运维负责人：</span>
                    <span class="contact-value">郭江勇</span>
                  </div>
                  <div class="contact-item">
                    <el-icon class="contact-icon"><Message /></el-icon>
                    <span class="contact-label">邮箱地址：</span>
                    <el-link type="primary" href="mailto:guojy@fun.tv">guojy@fun.tv</el-link>
                  </div>
                </div>
              </el-card>

              <el-card class="process-card" style="margin-top: 15px;">
                <template #header>
                  <div class="card-header">
                    <span>发布流程</span>
                  </div>
                </template>
                <div class="process-content">
                  <el-steps direction="vertical" class="compact-steps">
                    <el-step title="代码准备" description="确保代码已提交并推送到远程仓库" status="wait" />
                    <el-step title="联系运维" description="联系运维人员，说明发布需求" status="finish" />
                    <el-step title="运维操作" description="运维人员执行生产环境部署" status="wait" />
                    <el-step title="验证上线" description="确认生产环境功能正常" status="wait" />
                  </el-steps>
                </div>
              </el-card>


            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, User, Message } from '@element-plus/icons-vue'
import GitStatusPanel from '../components/GitStatusPanel.vue'
import { getGitStatus, getGitLog, getBranchStatus, gitPull, gitDeploy } from '../api/git'
import {useUserStore} from "@/stores/user.js";

const userStore = useUserStore();

const activeTab = ref('pull')
const loadingStatus = ref(false)
const loadingPullData = ref(false)
const loadingLog = ref(false)
const pulling = ref(false)
const deploying = ref(false)
const gitStatus = ref({
  is_clean: false,
  current_branch: '',
  changed_files: []
})
const gitLog = ref([])
const logCurrentPage = ref(1)
const logPageSize = 5
const showChangedFiles = ref(false)
const showChangedFilesDeploy = ref(false)
const branchStatus = ref({
  current_branch: '',
  has_remote: false,
  ahead: 0,
  behind: 0
})
const commitForm = ref({
  message: ''
})
const deploySteps = ref([])



// 检查用户是否有编辑权限
const hasEditPermission = computed(() => {
  return userStore.role === 'admin' || userStore.role === 'editor'
})

// 计算分页后的提交记录
const paginatedLog = computed(() => {
  const start = (logCurrentPage.value - 1) * logPageSize
  const end = start + logPageSize
  return gitLog.value.slice(start, end)
})

// 获取状态类型
const getStatusType = (status) => {
  // 绿色：已暂存的新文件或已暂存的修改（正常操作）
  if (status === 'A ' || status === 'M ') return 'success'
  // 红色：已删除
  if (status.includes('D')) return 'danger'
  // 黄色：已修改但未暂存，或部分暂存
  if (status === ' M' || status === 'MM') return 'warning'
  // 灰色：其他状态（未跟踪等）
  return 'info'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateStr
  }
}

// 获取 Git 状态
const fetchStatus = async () => {
  loadingStatus.value = true
  try {
    await Promise.all([
      getGitStatus().then(res => {
        gitStatus.value = res.data
      }),
      getBranchStatus().then(res => {
        branchStatus.value = res.data
      })
    ])
  } catch (error) {
    ElMessage.error('获取 Git 状态失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loadingStatus.value = false
  }
}

// 获取拉取代码页面的所有数据
const fetchPullData = async () => {
  loadingPullData.value = true
  try {
    await Promise.all([
      fetchStatus(),  // fetchStatus 内部已经包含了 getBranchStatus
      fetchGitLog()
      // 移除了 fetchBranchStatus()，因为 fetchStatus() 已经包含它
    ])
  } catch (error) {
    ElMessage.error('获取数据失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loadingPullData.value = false
  }
}

// 获取 Git 提交历史
const fetchGitLog = async () => {
  loadingLog.value = true
  try {
    const res = await getGitLog(15)
    gitLog.value = res.data
  } catch (error) {
    ElMessage.error('获取提交历史失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loadingLog.value = false
  }
}

// 获取分支状态
const fetchBranchStatus = async () => {
  try {
    const res = await getBranchStatus()
    branchStatus.value = res.data
  } catch (error) {
    ElMessage.error('获取分支状态失败: ' + (error.response?.data?.error || error.message))
  }
}

// Tab 切换
const handleTabChange = (tabName) => {
  // 切换tab不再自动刷新
}

// 拉取最新代码
const handlePull = async () => {
  pulling.value = true
  try {
    const res = await gitPull()
    ElMessage.success('拉取成功')
    await fetchPullData()
  } catch (error) {
    ElMessage.error('拉取失败: ' + (error.response?.data?.error || error.message))
  } finally {
    pulling.value = false
  }
}



// 提交并部署
const handleDeploy = async () => {
  if (!hasEditPermission.value) {
    ElMessage.error('权限不足，无法执行部署操作')
    return
  }

  if (!commitForm.value.message) {
    ElMessage.warning('请输入提交信息')
    return
  }

  if (gitStatus.value.is_clean) {
    ElMessage.warning('工作区干净，无需提交')
    return
  }

  // 检查分支状态，确保获取最新状态
  try {
    await fetchStatus()
  } catch (error) {
    ElMessage.error('获取分支状态失败，无法继续部署')
    return
  }

 // 如果落后远程，不允许部署
 if (branchStatus.value.has_remote && branchStatus.value.behind > 0) {
    ElMessageBox.alert(
      `当前分支落后远程 ${branchStatus.value.behind} 个提交。请先拉取最新代码后再部署，否则编译产物将不是最新的。`,
      '无法部署',
      {
        confirmButtonText: '知道了',
        type: 'warning'
      }
    )
    return
  }

  try {
    await ElMessageBox.confirm(
      '确认执行部署流程？这将执行：提交、推送、构建、切换到 alpha 分支并更新 dist 目录。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  deploying.value = true
  deploySteps.value = []

  try {
    const res = await gitDeploy(commitForm.value.message)
    deploySteps.value = res.data.steps || []
    ElMessage.success('部署成功')
    commitForm.value.message = ''
    await fetchStatus()
  } catch (error) {
    const errorData = error.response?.data
    if (errorData?.steps) {
      deploySteps.value = errorData.steps
    }
    ElMessage.error('部署失败: ' + (errorData?.error || error.message))
  } finally {
    deploying.value = false
  }
}

onMounted(async () => {
  fetchPullData()
})
</script>

<style scoped>
.upload-compile {
  padding: 20px;
  min-height: 100vh;
}

.tab-content {
  padding: 10px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header .section-title {
  margin: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
}

.changed-files h3,
.commit-section h3,
.deploy-steps h3 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

.commit-section {
  margin-top: 20px;
}

.step-output {
  margin: 0;
}

.console-output {
  margin: 0;
  padding: 12px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.no-output {
  color: #909399;
  font-style: italic;
}

.release-info {
  max-width: 800px;
}

.contact-card,
.process-card {
  margin-bottom: 15px;
}

.card-header {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.contact-content {
  padding: 8px 0;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 6px;
  font-size: 13px;
}

.contact-icon {
  color: #409eff;
  font-size: 14px;
}

.contact-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
  font-size: 13px;
}

.contact-value {
  color: #303133;
  font-size: 13px;
}

.process-content {
  padding: 8px 0;
}

.small-title-alert :deep(.el-alert__title) {
  font-size: 12px;
}
</style>
