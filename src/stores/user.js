import { defineStore } from 'pinia'
import { getCurrentUser as apiGetCurrentUser } from '../api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    username: (state) => state.user?.username || '',
    role: (state) => state.user?.role || '',
    roleName: (state) => {
      switch (state.user?.role) {
        case 'admin': return '管理员'
        case 'editor': return '编辑者'
        case 'viewer': return '查看者'
        default: return '未知角色'
      }
    },
    roleTagType: (state) => {
      switch (state.user?.role) {
        case 'admin': return 'danger'
        case 'editor': return 'warning'
        case 'viewer': return 'info'
        default: return 'info'
      }
    },
    currentUser: (state) => {
      return state.user
    }
  },

  actions: {
    async fetchUser() {
      if (this.loading) return; // 防止重复请求

      this.loading = true;
      this.error = null;

      try {
        const response = await apiGetCurrentUser();
        this.user = response.data;
        // 同时更新localStorage
        localStorage.setItem('currentUser', JSON.stringify(response.data));
      } catch (error) {
        this.error = error.message;
        this.user = null;
        // 清除localStorage中的用户信息
        localStorage.removeItem('currentUser');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setUser(userData) {
      this.user = userData;
      // 同时更新localStorage
      if (userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        localStorage.removeItem('currentUser');
      }
    },

    clearUser() {
      this.user = null;
      this.error = null;
      // 清除localStorage中的用户信息
      localStorage.removeItem('currentUser');
    },

    // 从localStorage恢复用户信息
    hydrateFromStorage() {
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          this.user = JSON.parse(userData);
        }
      } catch (error) {
        console.error('Failed to hydrate user from storage:', error);
        localStorage.removeItem('currentUser');
      }
    }
  },
})
