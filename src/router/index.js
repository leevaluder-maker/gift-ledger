import { createRouter, createWebHashHistory } from 'vue-router'
import RecordDetail from '../views/RecordDetail.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('../views/Records.vue')
  },
  {
    path: '/record/:id',
    name: 'RecordDetail',
    component: RecordDetail
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
