import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    // 检查是否是获取用户信息的请求
    const isGetUserRequest = error.config.url.includes('/auth/me');
    // 检查是否是登录请求
    const isLoginRequest = error.config.url.includes('/auth/login');
    
    // 导入store来处理用户状态
    import('../stores/user.js').then(({ useUserStore }) => {
      const userStore = useUserStore();
      
      if (error.response?.status === 401 && !isGetUserRequest && !isLoginRequest) {
        // 如果是未授权错误，但不是获取用户信息的请求，也不是登录请求，则重定向到登录页
        localStorage.removeItem('token'); // 清除本地token（如果有的话）
        userStore.clearUser(); // 清除用户信息
        window.location.href = '/login'; // 或者使用 router.push('/login')
      } else if (error.response?.status === 401 && isGetUserRequest) {
        // 如果是获取用户信息的请求失败，不重定向，让调用方处理
        localStorage.removeItem('token');
        userStore.clearUser(); // 清除用户信息
      } else if (error.response?.status === 401 && isLoginRequest) {
        // 如果是登录请求失败，不重定向，让登录页面处理错误
        localStorage.removeItem('token');
        userStore.clearUser(); // 清除可能存在的旧信息
      }
    }).catch(err => {
      console.error('Failed to import user store:', err);
    });
    
    return Promise.reject(error)
  }
)

// 用户注册
export const register = (data) => {
  return api.post('/auth/register', data)
}

// 用户登录
export const login = (data) => {
  return api.post('/auth/login', data)
}

// 用户登出
export const logout = () => {
  return api.post('/auth/logout')
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return api.get('/auth/me')
}
