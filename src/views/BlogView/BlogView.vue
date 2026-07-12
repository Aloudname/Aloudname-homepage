<template>
  <div class="aboutBox">
    <bannerView :imgUrl="bannerImg" :titleName="'博客'"></bannerView>

    <div class="mainBox">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <i class="el-icon-loading" style="font-size:32px;color:#909399;"></i>
        <p>加载文章中...</p>
      </div>

      <!-- 文章列表 -->
      <div v-else-if="posts.length" class="post-list">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="$router.push('/blog/' + post.slug)"
        >
          <!-- 封面图 -->
          <div class="post-cover" v-if="post.cover_url">
            <img :src="post.cover_url" :alt="post.title" />
          </div>

          <!-- 信息 -->
          <div class="post-info">
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-excerpt" v-if="post.excerpt">
              {{ post.excerpt }}
            </p>
            <div class="post-meta">
              <span class="post-date">📅 {{ formatDate(post.created_at) }}</span>
              <span v-if="post.category" class="post-cat">📁 {{ post.category }}</span>
              <el-tag
                v-for="tag in (post.tags || [])"
                :key="tag"
                size="mini"
                class="post-tag"
              >{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div style="font-size:64px;">📝</div>
        <p>还没有文章，快去后台写一篇吧！</p>
        <el-button type="primary" @click="$router.push('/admin/posts/new')">
          写文章
        </el-button>
      </div>
    </div>

    <footerView></footerView>
  </div>
</template>

<script>
import bannerView from "@/components/bannerView/index.vue"
import footerView from "@/components/footerView/index.vue"
import { getPublishedPosts } from '@/services/postsService'
import { getSectionConfig } from '@/services/pageConfigService'

export default {
  name: 'BlogView',

  components: { bannerView, footerView },

  data() {
    return {
      bannerImg: "http://chaichaiimage.oss-cn-hangzhou.aliyuncs.com/blog3.0/bg17.jpg",
      posts: [],
      loading: true,
    }
  },

  async created() {
    try {
      // 加载 Banner 配置获取背景图
      const about = await getSectionConfig('about')
      if (about.banner_image) this.bannerImg = about.banner_image

      // 加载已发布的文章
      const result = await getPublishedPosts({ page: 1, pageSize: 50 })
      this.posts = result.posts
    } catch (err) {
      console.error('[BlogView] 加载失败:', err.message)
    } finally {
      this.loading = false
    }
  },

  methods: {
    formatDate(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.loading-state, .empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #909399;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 0;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 24px rgba(0,0,0,0.1);
  }
}

.post-cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.post-info {
  padding: 20px 24px;
  text-align: left;
}

.post-title {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.post-excerpt {
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #909399;
}

.post-date {
  color: #606266;
}

.post-tag {
  font-size: 11px;
}
</style>

<style lang="scss">
.aboutBox {
  height: 100%;
  background: url("@/assets/cover.jpg");
  background-repeat: no-repeat;
  background-size: 500px;
  background-position: 110% 100%;
  background-attachment: fixed;

  .mainBox {
    width: 70%;
    margin: 0 auto;
    margin-top: 10px;
    min-height: 60vh;
  }
}
</style>
