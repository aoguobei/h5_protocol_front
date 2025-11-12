import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 获取协议列表
export const getProtocolList = () => {
  return api.get('/protocols')
}

// 获取协议内容
export const getProtocol = (filename) => {
  // 对文件名进行 URL 编码，处理特殊字符
  const encodedFilename = encodeURIComponent(filename)
  return api.get(`/protocols/${encodedFilename}`)
}

// 创建协议
export const createProtocol = (data) => {
  return api.post('/protocols', data)
}

// 更新协议
export const updateProtocol = (filename, data) => {
  // 对文件名进行 URL 编码
  const encodedFilename = encodeURIComponent(filename)
  return api.put(`/protocols/${encodedFilename}`, data)
}

// 删除协议
export const deleteProtocol = (filename) => {
  // 对文件名进行 URL 编码
  const encodedFilename = encodeURIComponent(filename)
  return api.delete(`/protocols/${encodedFilename}`)
}

