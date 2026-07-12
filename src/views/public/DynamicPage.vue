<template>
  <div class="dynamic-page">
    <!-- Banner -->
    <bannerView :imgUrl="bannerImage" :titleName="page?.title || '页面'" ref="banner" />

    <!-- 内容区 -->
    <div class="page-content" v-loading="loading">
      <div v-if="error" class="error-state">
        <h2>页面加载失败</h2>
        <p>{{ error }}</p>
        <el-button @click="$router.push('/')">返回首页</el-button>
      </div>

      <div v-else-if="page" class="content-card">
        <div class="markdown-body">
          <VueMarkdown :source="page.content || ''" />
        </div>
      </div>
    </div>

    <footerView />
  </div>
</template>

<script>
import bannerView from '@/components/bannerView/index'
import footerView from '@/components/footerView/index.vue'
import VueMarkdown from 'vue-markdown'
import { getPageBySlug } from '@/services/pagesService'
import { getSectionConfig } from '@/services/pageConfigService'
import 'highlight.js/styles/github.css'
import 'github-markdown-css'

export default {
  name: 'DynamicPage',
  components: { bannerView, footerView, VueMarkdown },

  data() {
    return {
      page: null,
      loading: true,
      error: null,
      bannerImage: '',
    }
  },

  async created() {
    const slug = this.$route.params.slug
    if (!slug) { this.error = '无效的页面链接'; this.loading = false; return }

    try {
      const [pageData, about] = await Promise.all([
        getPageBySlug(slug),
        getSectionConfig('about'),
      ])
      this.page = pageData
      this.bannerImage = about.banner_image || ''
      if (!this.page) this.error = '页面不存在或未发布'
    } catch (err) {
      console.error('[DynamicPage]', err.message)
      this.error = err.message
    } finally {
      this.loading = false
    }
  },
}
</script>

<style lang="scss" scoped>
.dynamic-page { min-height: 100vh; background: #f9fafb; }

.page-content {
  width: 70%;
  max-width: 900px;
  margin: -60px auto 40px;
  position: relative;
  z-index: 2;
}

.content-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.error-state {
  text-align: center;
  padding: 60px;
  background: #fff;
  border-radius: 12px;
  h2 { margin-bottom: 12px; }
  p { color: #909399; margin-bottom: 20px; }
}

.markdown-body {
  text-align: left;
  font-size: 16px;
  line-height: 1.8;
  img { max-width: 100%; border-radius: 8px; }
  pre { border-radius: 8px; }
}
</style>
