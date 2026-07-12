/**
 * 页面配置全局缓存（响应式）
 *
 * 使用方式：
 *   import pageConfigStore from '@/stores/pageConfig'
 *   await pageConfigStore.loadAll()
 *   const config = pageConfigStore.getSection('home')
 */
import Vue from 'vue'
import supabase from '@/config/supabase'
import { loadSectionsConfig, subscribeToChanges } from '@/services/pageConfigService'

const ALL_SECTIONS = ['background', 'cursor', 'home', 'banner', 'music', 'about', 'footer', 'global']

const state = Vue.observable({
  cache: {},
  loading: false,
  lastFetch: null,
  error: null,
})

let subscription = null

export default {
  /** 所有已加载的配置区块 */
  get cache() { return state.cache },
  get loading() { return state.loading },
  get lastFetch() { return state.lastFetch },
  get error() { return state.error },

  /**
   * 加载所有区块配置
   * @param {string[]} sections - 要加载的区块列表，默认全部
   */
  async loadAll(sections = ALL_SECTIONS) {
    state.loading = true
    state.error = null

    try {
      const data = await loadSectionsConfig(sections)
      state.cache = { ...state.cache, ...data }
      state.lastFetch = new Date()
    } catch (err) {
      console.error('[pageConfigStore] 加载配置失败:', err)
      state.error = err.message
    } finally {
      state.loading = false
    }
  },

  /**
   * 获取某区块的配置
   * @param {string} section
   * @returns {Record<string, any>}
   */
  getSection(section) {
    return state.cache[section] || {}
  },

  /**
   * 获取单个配置值
   * @param {string} section
   * @param {string} key
   * @param {any} defaultValue
   * @returns {any}
   */
  getValue(section, key, defaultValue = undefined) {
    const sec = state.cache[section]
    if (sec && key in sec) return sec[key]
    return defaultValue
  },

  /**
   * 清除缓存（编辑器保存后调用）
   */
  invalidate() {
    state.cache = {}
    state.lastFetch = null
  },

  /**
   * 清除指定区块缓存
   * @param {string} section
   */
  invalidateSection(section) {
    delete state.cache[section]
  },

  /**
   * 启动 Realtime 订阅（管理后台使用）
   */
  subscribeRealtime() {
    if (subscription) return
    subscription = subscribeToChanges((payload) => {
      console.log('[pageConfigStore] 检测到配置变更:', payload.eventType)
      // 配置变更后自动刷新缓存
      this.invalidate()
    })
  },

  /**
   * 取消 Realtime 订阅
   */
  unsubscribeRealtime() {
    if (subscription) {
      supabase.removeChannel(subscription)
      subscription = null
    }
  },
}
