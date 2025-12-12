import request from './request'

export const getUserList = (params) => request.get('/users', { params })

export const updateUserRole = (userId, data) => request.put(`/users/${userId}/role`, data)

export const toggleUserStatus = (userId) => request.put(`/users/${userId}/toggle`)
