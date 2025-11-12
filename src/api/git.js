import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000 // 5 分钟超时，因为构建可能需要较长时间
})

// 获取 Git 状态
export const getGitStatus = () => {
  return api.get('/git/status')
}

// 获取 Git 提交历史
export const getGitLog = (limit = 15) => {
  return api.get('/git/log', { params: { limit } })
}

// 获取分支状态（领先/落后）
export const getBranchStatus = () => {
  return api.get('/git/branch-status')
}

// 拉取最新代码
export const gitPull = () => {
  return api.post('/git/pull')
}

// 执行部署流程
export const gitDeploy = (commitMessage) => {
  return api.post('/git/deploy', { commit_message: commitMessage })
}

