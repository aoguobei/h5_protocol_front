import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import ProtocolList from '../views/ProtocolList.vue'
import LinkGenerator from '../views/LinkGenerator.vue'
import UploadCompile from '../views/UploadCompile.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/protocols',
    children: [
      {
        path: '/link-generator',
        name: 'LinkGenerator',
        component: LinkGenerator
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
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

