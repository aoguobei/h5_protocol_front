import request from './request'

export const getUserList = (params) => request.get('/users', { params })

export const updateUserRole = (userId, data) => request.put(`/users/${userId}/role`, data)

export const deleteUser = (userId) => request.delete(`/users/${userId}`)
