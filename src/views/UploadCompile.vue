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

            <!-- 分支状态 -->
            <div class="git-status-wrapper" style="margin-bottom: 20px;">
              <div class="git-status">
                <div class="status-item">
                  <span class="status-label">当前分支：</span>
                  <el-tag size="small">{{ branchStatus.current_branch || '-' }}</el-tag>
                </div>
                <div class="status-item status-item-with-button">
                  <span class="status-label">工作区状态：</span>
                  <el-tag :type="gitStatus.is_clean ? 'success' : 'warning'" size="small">
                    {{ gitStatus.is_clean ? '干净' : '有变更' }}
                  </el-tag>
                  <el-button
                    type="primary"
                    @click="handlePull"
                    :loading="pulling"
                    :disabled="!gitStatus.is_clean"
                    size="small"
                    style="margin-left: 12px;"
                  >
                    <el-icon><Download /></el-icon>
                    拉取最新代码
                  </el-button>
                  <span v-if="!gitStatus.is_clean" style="margin-left: 8px; color: #909399; font-size: 12px;">
                    工作区不干净时无法拉取
                  </span>
                </div>
                <div class="status-item" v-if="branchStatus.has_remote">
                  <span class="status-label">领先远程：</span>
                  <el-tag :type="branchStatus.ahead > 0 ? 'warning' : 'info'" size="small">
                    {{ branchStatus.ahead }} 个提交
                  </el-tag>
                </div>
                <div class="status-item" v-if="branchStatus.has_remote">
                  <span class="status-label">落后远程：</span>
                  <el-tag :type="branchStatus.behind > 0 ? 'danger' : 'info'" size="small">
                    {{ branchStatus.behind }} 个提交
                  </el-tag>
                </div>
                <!-- 变更文件列表（默认折叠，最多显示5条，超出可滚动） -->
                <div v-if="gitStatus.changed_files && gitStatus.changed_files.length > 0" class="changed-files-section">
                  <div class="changed-files-header" @click="showChangedFiles = !showChangedFiles">
                    <span class="changed-files-title">
                      <el-icon class="changed-files-icon" :class="{ 'is-expanded': showChangedFiles }">
                        <ArrowRight />
                      </el-icon>
                      变更文件
                    </span>
                    <el-tag type="info" size="small" class="changed-files-count">
                      {{ gitStatus.changed_files.length }}
                    </el-tag>
                  </div>
                  <el-collapse-transition>
                    <div v-show="showChangedFiles" class="changed-files-list">
                      <div
                        v-for="file in gitStatus.changed_files"
                        :key="file.filename"
                        class="changed-file-item"
                      >
                        <el-tag :type="getStatusType(file.status)" size="small" class="file-status-tag">
                          {{ formatStatus(file.status) }}
                        </el-tag>
                        <span class="file-name">{{ file.filename }}</span>
                      </div>
                    </div>
                  </el-collapse-transition>
                </div>
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
              <div class="git-status">
                <div class="status-item">
                  <span class="status-label">当前分支：</span>
                  <el-tag size="small">{{ gitStatus.current_branch || '-' }}</el-tag>
                </div>
                <div class="status-item">
                  <span class="status-label">工作区状态：</span>
                  <el-tag :type="gitStatus.is_clean ? 'success' : 'warning'" size="small">
                    {{ gitStatus.is_clean ? '干净' : '有变更' }}
                  </el-tag>
                </div>
                <div class="status-item" v-if="branchStatus.has_remote">
                  <span class="status-label">领先远程：</span>
                  <el-tag :type="branchStatus.ahead > 0 ? 'warning' : 'info'" size="small">
                    {{ branchStatus.ahead }} 个提交
                  </el-tag>
                </div>
                <div class="status-item" v-if="branchStatus.has_remote">
                  <span class="status-label">落后远程：</span>
                  <el-tag :type="branchStatus.behind > 0 ? 'danger' : 'info'" size="small">
                    {{ branchStatus.behind }} 个提交
                  </el-tag>
                </div>
                <!-- 变更文件列表（默认折叠，最多显示5条，超出可滚动） -->
                <div v-if="gitStatus.changed_files && gitStatus.changed_files.length > 0" class="changed-files-section">
                  <div class="changed-files-header" @click="showChangedFilesDeploy = !showChangedFilesDeploy">
                    <span class="changed-files-title">
                      <el-icon class="changed-files-icon" :class="{ 'is-expanded': showChangedFilesDeploy }">
                        <ArrowRight />
                      </el-icon>
                      变更文件
                    </span>
                    <el-tag type="info" size="small" class="changed-files-count">
                      {{ gitStatus.changed_files.length }}
                    </el-tag>
                  </div>
                  <el-collapse-transition>
                    <div v-show="showChangedFilesDeploy" class="changed-files-list">
                      <div
                        v-for="file in gitStatus.changed_files"
                        :key="file.filename"
                        class="changed-file-item"
                      >
                        <el-tag :type="getStatusType(file.status)" size="small" class="file-status-tag">
                          {{ formatStatus(file.status) }}
                        </el-tag>
                        <span class="file-name">{{ file.filename }}</span>
                      </div>
                    </div>
                  </el-collapse-transition>
                </div>
              </div>
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
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, ArrowRight } from '@element-plus/icons-vue'
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

// 格式化状态（使用 Git 原始状态）
const formatStatus = (status) => {
  // Git status 状态码说明：
  const statusMap = {
    ' M': 'Modified (工作区修改，未暂存)', // 第一个字符空格（暂存区无变化），第二个 M（工作区修改）
    'M ': 'Staged (暂存区修改，待提交)',  // 第一个 M（暂存区修改），第二个空格（工作区无变化）
    'A ': 'Added (已暂存新增，待提交)',   // 第一个 A（暂存区新增），第二个空格（工作区无变化）
    'D ': 'Deleted (已暂存删除，待提交)', // 第一个 D（暂存区删除），第二个空格（工作区无变化）→ 格式正确！
    ' D': 'Deleted (工作区删除，未暂存)', // 补充：工作区删了但没暂存的场景（避免遗漏）
    '??': 'Untracked (未跟踪，未加入版本控制)',
    'MM': 'Modified (暂存区+工作区均修改)', // 两个 M 都有值，无空格
    'R ': 'Renamed (已暂存重命名，待提交)',
    'C ': 'Copied (已暂存复制，待提交)',
    'AD': 'Added & Deleted (暂存区已新增，工作区已删除)' // 无空格（两个位置都有状态：A=暂存区，D=工作区）
  };
  return statusMap[status] || status
}

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
  if (tabName === 'pull') {
    fetchPullData()
  } else if (tabName === 'deploy') {
    fetchStatus()
  }
}

// 拉取最新代码
const handlePull = async () => {
  if (!gitStatus.value.is_clean) {
    ElMessage.warning('工作区不干净，请先提交或暂存变更')
    return
  }

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

.changed-files-section {
  margin-top: 8px;
  width: 100%;
}

.changed-files-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  user-select: none;
  transition: color 0.2s;
}

.changed-files-header:hover {
  color: #409eff;
}

.changed-files-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.changed-files-icon {
  transition: transform 0.3s;
  font-size: 12px;
}

.changed-files-icon.is-expanded {
  transform: rotate(90deg);
}

.changed-files-count {
  margin-left: auto;
}

.changed-files-list {
  margin-top: 8px;
  width: 100%;
}

.changed-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  width: 100%;
}

.changed-file-item:last-child {
  border-bottom: none;
}

.file-status-tag {
  flex-shrink: 0;
  min-width: 80px;
  text-align: center;
}

.file-name {
  flex: 1;
  word-break: break-all;
  font-size: 14px;
  color: #606266;
}

.git-status {
  flex: 0 0 auto;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item-with-button {
  flex-wrap: wrap;
}

.status-label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
}

.action-section {
  margin-bottom: 20px;
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
</style>
