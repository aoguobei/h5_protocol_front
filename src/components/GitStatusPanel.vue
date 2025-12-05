<template>
  <div class="git-status-panel">
    <div class="status-item">
      <span class="status-label">当前分支：</span>
      <span class="status-value">{{ branchStatus.current_branch || '-' }}</span>
    </div>
    <div class="status-item">
      <span class="status-label">工作区状态：</span>
      <span class="status-value" :class="gitStatus.is_clean ? 'status-clean' : 'status-dirty'">
        {{ gitStatus.is_clean ? 'clean' : 'dirty(您有尚未提交的代码修改)' }}
      </span>
      <el-button
        v-if="!gitStatus.is_clean && gitStatus.changed_files && gitStatus.changed_files.length > 0"
        link
        size="small"
        @click="toggleChangedFiles"
        class="status-details-btn"
      >
        <el-icon class="status-arrow" :class="{ 'arrow-up': showChangedFiles }">
          <ArrowRight />
        </el-icon>
        {{ showChangedFiles ? '收起' : '展开' }}
      </el-button>
    </div>

    <div class="status-item" v-if="branchStatus.has_remote">
      <span class="status-label">领先远程：</span>
      <span class="status-value" :class="branchStatus.ahead > 0 ? 'status-warning' : 'status-info'">
        {{ branchStatus.ahead }} 个提交
      </span>
    </div>
    <div class="status-item" v-if="branchStatus.has_remote">
      <span class="status-label">落后远程：</span>
      <span class="status-value" :class="branchStatus.behind > 0 ? 'status-danger' : 'status-info'">
        {{ branchStatus.behind }} 个提交
      </span>
    </div>

    <!-- 变更文件列表 -->
    <div v-if="showChangedFiles" class="changed-files-section">
        <div class="section-header">
          <h5>文件变更详情</h5>
        </div>
        <div v-if="stagedFiles.length === 0 && modifiedFiles.length === 0 && untrackedFiles.length === 0" class="no-changes">
          <span>暂无变更信息</span>
        </div>
        <div v-else class="changes-groups">
          <!-- 已暂存文件 -->
          <div v-if="stagedFiles.length > 0" class="change-group">
            <div class="group-header">
              <h6>Changes to be committed:</h6>
              <div class="group-hint">(use "git restore --staged &lt;file&gt;..." to unstage)</div>
            </div>
            <div class="group-files">
              <div
                v-for="(file, index) in stagedFiles"
                :key="'staged-' + index"
                class="change-item change-staged"
              >
                <span class="change-type">modified:</span>
                <span class="change-file">{{ file }}</span>
              </div>
            </div>
          </div>

          <!-- 未暂存的修改 -->
          <div v-if="modifiedFiles.length > 0" class="change-group">
            <div class="group-header">
              <h6>Changes not staged for commit:</h6>
              <div class="group-hint">(use "git add &lt;file&gt;..." to update what will be committed)</div>
              <div class="group-hint">(use "git restore &lt;file&gt;..." to discard changes in working directory)</div>
            </div>
            <div class="group-files">
              <div
                v-for="(file, index) in modifiedFiles"
                :key="'modified-' + index"
                class="change-item change-modified"
              >
                <span class="change-type">modified:</span>
                <span class="change-file">{{ file }}</span>
              </div>
            </div>
          </div>

          <!-- 未跟踪文件 -->
          <div v-if="untrackedFiles.length > 0" class="change-group">
            <div class="group-header">
              <h6>Untracked files:</h6>
              <div class="group-hint">(use "git add &lt;file&gt;..." to include in what will be committed)</div>
            </div>
            <div class="group-files">
              <div
                v-for="(file, index) in untrackedFiles"
                :key="'untracked-' + index"
                class="change-item change-untracked"
              >
                <span class="change-file">{{ file }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  gitStatus: {
    type: Object,
    default: () => ({
      is_clean: false,
      changed_files: []
    })
  },
  branchStatus: {
    type: Object,
    default: () => ({
      current_branch: '',
      has_remote: false,
      ahead: 0,
      behind: 0
    })
  }
})

const showChangedFiles = ref(false)

const toggleChangedFiles = () => {
  showChangedFiles.value = !showChangedFiles.value
}

// 计算属性：分组文件
const stagedFiles = computed(() => {
  return props.gitStatus.changed_files?.filter(f => f.status === 'M ' || f.status === 'A ').map(f => f.filename) || []
})

const modifiedFiles = computed(() => {
  return props.gitStatus.changed_files?.filter(f => f.status === ' M' || f.status === 'MM').map(f => f.filename) || []
})

const untrackedFiles = computed(() => {
  return props.gitStatus.changed_files?.filter(f => f.status === '??').map(f => f.filename) || []
})

/*const formatStatus = (status) => {
  const statusMap = {
    ' M': 'Modified (工作区修改，未暂存)',
    'M ': 'Staged (暂存区修改，待提交)',
    'A ': 'Added (已暂存新增，待提交)',
    'D ': 'Deleted (已暂存删除，待提交)',
    ' D': 'Deleted (工作区删除，未暂存)',
    '??': 'Untracked (未跟踪，未加入版本控制)',
    'MM': 'Modified (暂存区+工作区均修改)',
    'R ': 'Renamed (已暂存重命名，待提交)',
    'C ': 'Copied (已暂存复制，待提交)',
    'AD': 'Added & Deleted (暂存区已新增，工作区已删除)'
  };
  return statusMap[status] || status
}*/

const getStatusType = (status) => {
  if (status === 'A ' || status === 'M ') return 'success'
  if (status.includes('D')) return 'danger'
  if (status === ' M' || status === 'MM') return 'warning'
  return 'info'
}
</script>

<style scoped>
.git-status-panel {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.status-label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
  font-weight: 600;
}

.status-value {
  font-size: 14px;
  font-weight: normal;
}

.status-clean {
  color: #67c23a;
}

.status-dirty {
  color: #f56c6c;
}

.status-warning {
  color: #e6a23c;
}

.status-danger {
  color: #f56c6c;
}

.status-info {
  color: #909399;
}

.status-details-btn {
  margin-left: 8px;
  color: #409eff;
  font-size: 12px;
  margin-bottom: -3px;
}

.status-details-btn:hover {
  color: #337ecc;
}

.status-arrow {
  transition: transform 0.3s ease;
  margin-right: 4px;
}

.status-arrow.arrow-up {
  transform: rotate(90deg);
}



.changed-files-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid #e9ecef;
}

.section-header {
  margin-bottom: 10px;
}

.section-header h5 {
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.no-changes {
  color: #6c757d;
  font-size: 13px;
  padding: 8px 0;
}

.changes-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.change-group {

}

.group-header h6 {
  font-size: 13px;
  color: #2c3e50;
  margin: 0 0 4px 0;
  font-weight: 600;
}

.group-hint {
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
  margin-bottom: 2px;
}

.group-files {
  display: flex;
  flex-direction: column;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 13px;
  font-family: monospace;
}

.change-type {
  font-weight: 500;
  min-width: 70px;
}

.change-file {
  flex: 1;
  word-break: break-all;
}

.change-staged .change-type,
.change-staged .change-file {
  color: #28a745;
}

.change-modified .change-type,
.change-modified .change-file {
  color: #dc3545;
}

.change-untracked .change-file {
  color: #dc3545;
}


</style>
