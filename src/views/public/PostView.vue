<!--
  博客文章详情页（公开）
  通过 URL 中的 slug 参数加载文章内容
-->
<template>
  <div class="post-page">
    <bannerView
      :imgUrl="bannerImage"
      :titleName="post?.title || '文章详情'"
      ref="banner"
    />

    <div class="post-content-wrapper" v-loading="loading">
      <div v-if="error" class="post-error">
        <h2>文章加载失败</h2>
        <p>{{ error }}</p>
        <el-button @click="$router.push('/blog')">返回博客列表</el-button>
      </div>

      <div v-else-if="post" class="post-content">
        <!-- 文章头部信息 -->
        <div class="post-header">
          <div class="post-meta">
            <span class="post-date">{{ formatDate(post.created_at) }}</span>
            <el-tag
              v-for="tag in post.tags"
              :key="tag"
              size="small"
              class="post-tag"
            >{{ tag }}</el-tag>
            <span v-if="post.category" class="post-category">
              📁 {{ post.category }}
            </span>
          </div>
        </div>

        <!-- 文章封面 -->
        <img
          v-if="post.cover_url"
          :src="post.cover_url"
          :alt="post.title"
          class="post-cover"
        />

        <!-- Markdown 正文 -->
        <div class="markdown-body post-body">
          <VueMarkdown :source="post.content" />
        </div>

        <!-- 底部导航 -->
        <div class="post-footer-nav">
          <el-button
            type="text"
            icon="el-icon-back"
            @click="$router.push('/blog')"
          >返回博客列表</el-button>
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
import pageConfigStore from '@/stores/pageConfig'
import { getPostBySlug } from '@/services/postsService'
import 'highlight.js/styles/github.css'
import 'github-markdown-css'

export default {
  name: 'PostView',

  components: { bannerView, footerView, VueMarkdown },

  data() {
    return {
      post: null,
      loading: true,
      error: null,
      bannerImage: '',
    }
  },

  async created() {
    const slug = this.$route.params.slug
    if (!slug) {
      this.error = '无效的文章链接'
      this.loading = false
      return
    }

    try {
      // 加载页面配置获取 banner 图片
      await pageConfigStore.loadAll(['about'])
      this.bannerImage = pageConfigStore.getValue('about', 'banner_image',
        'https://chaichaiimage.oss-cn-hangzhou.aliyuncs.com/blog3.0/bg16.jpg')

      // 加载文章
      this.post = await getPostBySlug(slug)
      if (!this.post) {
        this.error = '文章不存在或未发布'
      }
    } catch (err) {
      console.error('[PostView] 加载文章失败:', err)
      this.error = err.message || '加载失败'
    } finally {
      this.loading = false
    }
  },

  methods: {
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
  },
}
</script>

<style lang="scss">
.post-page {
  min-height: 100vh;
  background: #f9fafb;
}

.post-content-wrapper {
  width: 70%;
  max-width: 900px;
  margin: -60px auto 40px;
  position: relative;
  z-index: 2;
}

.post-content {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.post-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #909399;
}

.post-date {
  color: #606266;
}

.post-tag {
  font-size: 12px;
}

.post-category {
  font-size: 14px;
  color: #909399;
}

.post-cover {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 24px;
}

.post-body {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  text-align: left;

  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 16px;
  }

  img {
    max-width: 100%;
    border-radius: 8px;
  }

  pre {
    border-radius: 8px;
    margin: 16px 0;
  }

  blockquote {
    border-left: 4px solid #42b983;
    padding: 8px 16px;
    margin: 16px 0;
    background: #f0f9f4;
    border-radius: 0 8px 8px 0;
  }
}

.post-footer-nav {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  text-align: left;
}

.post-error {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;

  h2 {
    margin-bottom: 12px;
    color: #303133;
  }

  p {
    color: #909399;
    margin-bottom: 20px;
  }
}
</style>
