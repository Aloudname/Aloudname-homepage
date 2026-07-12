import Vue from 'vue'
import App from './App.vue'
import router from './router'

// Supabase 初始化（确保在应用启动时加载）
import '@/config/supabase'
import { initAuthListener } from '@/services/authService'

// 原有插件
import 'amfe-flexible'
import ElementUI from 'element-ui'
import { ElementTiptapPlugin } from 'element-tiptap'
import 'element-ui/lib/theme-chalk/index.css'
import 'element-tiptap/lib/index.css'
import animated from 'animate.css'

// 全局样式
import '@/styles/admin.scss'

Vue.use(ElementUI)
Vue.use(ElementTiptapPlugin, {
  lang: 'zh',
})

Vue.config.productionTip = false

// 初始化鉴权状态监听
initAuthListener()

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
