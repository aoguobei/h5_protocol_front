import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 获取用户列表
export const getUserList = (params) => {
 return api.get('/users', { params })
}

// 更新用户角色
export const updateUserRole = (userId, data) => {
  return api.put(`/users/${userId}/role`, data)
}

// 删除用户
export const deleteUser = (userId) => {
 return api.delete(`/users/${userId}`)
}