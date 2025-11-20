<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {useUserStore} from "@/stores/user.js";

const router = useRouter()
const userStore = useUserStore();

// 在应用启动时检查用户登录状态
onMounted(async () => {
  try {
    // 尝试获取当前用户信息，验证登录状态
    await userStore.hydrateFromStorage()
    if (userStore.currentUser) await userStore.fetchUser()


    // 如果当前在登录页且已登录，重定向到协议列表
    if (router.currentRoute.value.name === 'Login') {
      router.push('/protocols')
    }
  } catch (error) {
    // 如果获取用户信息失败（未登录），且不在登录页，则重定向到登录页
    if (router.currentRoute.value.name !== 'Login') {
      router.push('/login')
    }
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
