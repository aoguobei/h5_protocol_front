import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true
})

request.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => response,
  error => {
    const isGetUserRequest = error.config.url.includes('/auth/me')
    const isLoginRequest = error.config.url.includes('/auth/login')
    
    import('../stores/user.js').then(({ useUserStore }) => {
      const userStore = useUserStore()
      
      if (error.response?.status === 401 && !isGetUserRequest && !isLoginRequest) {
        localStorage.removeItem('token')
        userStore.clearUser()
        window.location.href = '/login'
      } else if (error.response?.status === 401 && isGetUserRequest) {
        localStorage.removeItem('token')
        userStore.clearUser()
      } else if (error.response?.status === 401 && isLoginRequest) {
        localStorage.removeItem('token')
        userStore.clearUser()
      }
    }).catch(err => {
      console.error('Failed to import user store:', err)
    })
    
    return Promise.reject(error)
  }
)

export default request
