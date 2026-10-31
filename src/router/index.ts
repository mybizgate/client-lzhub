import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/catalogue', name: 'catalogue', component: () => import('../views/CatalogueView.vue'), meta: { mode: 'all' } },
    { path: '/category/:slug', name: 'category', component: () => import('../views/CatalogueView.vue'), meta: { mode: 'category' } },
    { path: '/promosi', name: 'deals', component: () => import('../views/CatalogueView.vue'), meta: { mode: 'deals' } },
    { path: '/kegemaran', name: 'favorites', component: () => import('../views/CatalogueView.vue'), meta: { mode: 'favorites' } },
    { path: '/product/:slug', name: 'product', component: () => import('../views/ProductView.vue') },
    { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/orders', name: 'orders', component: () => import('../views/OrdersView.vue') },
    { path: '/orders/:id', name: 'order', component: () => import('../views/OrderDetailView.vue') },
    { path: '/account', name: 'account', component: () => import('../views/AccountView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('../views/ForgotPasswordView.vue') },
    { path: '/reset-password', name: 'reset-password', component: () => import('../views/ResetPasswordView.vue') },
    {
      path: '/api-test',
      name: 'api-test',
      component: () => import('@/views/ApiTestView.vue'),
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (to.name === from.name && to.name === 'catalogue') return false
    // Views are lazy-loaded; defer one tick so the new view is in the DOM before scrolling.
    return new Promise((resolve) => setTimeout(() => resolve({ top: 0 }), 0))
  },
})
