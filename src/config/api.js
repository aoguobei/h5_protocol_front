// API 配置
const isDev = import.meta.env.MODE === 'development'

export const API_BASE_URL = isDev
  ? 'http://172.17.5.57:5000/api'
  : 'http://172.17.3.118:5000/api'
