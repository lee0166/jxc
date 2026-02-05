import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    redirect: '/home/statistics',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import('../views/Product.vue')
      },
      {
        path: 'inbound',
        name: 'Inbound',
        component: () => import('../views/Inbound.vue')
      },
      {
        path: 'sales',
        name: 'Sales',
        component: () => import('../views/Sales.vue')
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../views/Inventory.vue')
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/Statistics.vue')
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('../views/Records.vue')
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('../views/Config.vue')
      },
      {
        path: 'scan',
        name: 'Scan',
        component: () => import('../views/Scan.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  // 如果访问登录页且已登录，跳转到首页
  if (to.path === '/login' && isLoggedIn) {
    next('/home')
    return
  }

  // 如果访问需要登录的页面且未登录，跳转到登录页
  if (to.path !== '/login' && !isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router
