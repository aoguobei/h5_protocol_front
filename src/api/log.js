import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 获取操作日志
export const getLogList = (params) => {
  return api.get('/logs', { params: params })
}