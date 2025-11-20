import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import ProtocolList from '../views/ProtocolList.vue'
import LinkGenerator from '../views/LinkGenerator.vue'
import UploadCompile from '../views/UploadCompile.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/link-generator',
        name: 'LinkGenerator',
        component: LinkGenerator,
        meta: { requiresAuth: false }
      },
      {
        path: '/protocols',
        name: 'ProtocolList',
        component: ProtocolList
      },
      {
        path: '/upload-compile',
        name: 'UploadCompile',
        component: UploadCompile
      },
      {
        path: '/edit/:filename?',
        name: 'ProtocolEdit',
        component: () => import('../views/ProtocolEdit.vue')
      },
      {
        path: '/users',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue'),
        meta: { requiresAuth: true, requiredRole: 'admin' }
      },
      {
        path: '/logs',
        name: 'LogManagement',
        component: () => import('../views/LogManagement.vue'),
        meta: { requiresAuth: true, requiredRole: 'admin' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/protocols'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 如果路由不需要认证（如登录页），直接放行
 if (!to.meta.requiresAuth) {
    next()
    return
  }

  // 动态导入store和auth
  const [{ useUserStore }] = await Promise.all([
    import('../stores/user.js'),
    import('../api/auth.js')
 ]);

  const userStore = useUserStore();

  // 尝试获取用户信息
  try {
    // 如果store中已有用户信息，直接使用
    if (userStore.user) {
      // 检查角色权限
      if (to.meta.requiredRole && userStore.role !== to.meta.requiredRole) {
        // 如果用户没有足够权限，重定向到协议列表页
        next('/protocols')
        return
      }
      next()
      return
    }

    // 如果store中没有用户信息，尝试从localStorage恢复
    userStore.hydrateFromStorage();

    // 如果恢复后仍没有用户信息，则从API获取
    if (!userStore.user) {
      await userStore.fetchUser();
    }

    // 检查角色权限
    if (to.meta.requiredRole && userStore.role !== to.meta.requiredRole) {
      // 如果用户没有足够权限，重定向到协议列表页
      next('/protocols')
      return
    }

    next()
  } catch (error) {
    // 如果获取用户信息失败（未登录），清除用户状态并重定向到登录页
    userStore.clearUser();
    next('/login')
  }
})

export default router
