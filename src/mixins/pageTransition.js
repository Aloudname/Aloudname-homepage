/**
 * 页面过渡 —— 方向感知滑动 + 同级淡入淡出
 * 根据路由深度自动判断前进/后退
 */
export default {
  data() {
    return { transitionName: 'fade' }
  },
  watch: {
    $route(to, from) {
      if (!from.path) { this.transitionName = 'fade'; return }
      const toD = to.path.split('/').length
      const fromD = from.path.split('/').length
      if (toD === fromD) this.transitionName = 'fade'
      else this.transitionName = toD > fromD ? 'slide-left' : 'slide-right'
    },
  },
}
