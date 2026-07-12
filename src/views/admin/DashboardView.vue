<!--
  管理后台仪表盘
  统计概览 + 快捷入口
-->
<template>
  <div>
    <h3 style="margin-bottom: 20px;">仪表盘</h3>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-value">{{ postCount }}</div>
        <div class="stat-label">文章总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🖼️</div>
        <div class="stat-value">{{ assetCount }}</div>
        <div class="stat-label">资源文件</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ configCount }}</div>
        <div class="stat-label">配置项</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🕐</div>
        <div class="stat-value">{{ lastUpdate }}</div>
        <div class="stat-label">上次更新</div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="editor-panel">
      <div class="panel-title">快捷操作</div>
      <el-row :gutter="16">
        <el-col :span="6" v-for="item in shortcuts" :key="item.path">
          <el-card
            shadow="hover"
            class="shortcut-card"
            @click.native="$router.push(item.path)"
          >
            <div class="shortcut-icon">{{ item.icon }}</div>
            <div class="shortcut-label">{{ item.label }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近文章 -->
    <div class="editor-panel">
      <div class="panel-title">最近文章</div>
      <el-table :data="recentPosts" style="width: 100%">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.is_published ? 'success' : 'info'"
              size="small"
            >{{ scope.row.is_published ? '已发布' : '草稿' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.updated_at) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { getAllPosts } from '@/services/postsService'
import { getAssets } from '@/services/assetsService'
import { getAllConfigs } from '@/services/pageConfigService'

export default {
  name: 'DashboardView',

  data() {
    return {
      postCount: 0,
      assetCount: 0,
      configCount: 0,
      lastUpdate: '--',
      recentPosts: [],
      shortcuts: [
        { icon: '🌄', label: '编辑背景', path: '/admin/editor/bg' },
        { icon: '🖱️', label: '编辑光标', path: '/admin/editor/cursor' },
        { icon: '📝', label: '写文章', path: '/admin/posts/new' },
        { icon: '🖼️', label: '上传资源', path: '/admin/assets' },
      ],
    }
  },

  async created() {
    await this.loadStats()
  },

  methods: {
    async loadStats() {
      try {
        const [postsRes, assetsRes, configsRes] = await Promise.allSettled([
          getAllPosts(),
          getAssets({ page: 1, pageSize: 1 }),
          getAllConfigs(),
        ])

        if (postsRes.status === 'fulfilled') {
          const posts = postsRes.value
          this.postCount = posts.length
          this.recentPosts = posts.slice(0, 5)

          const latest = posts.reduce((max, p) => {
            const d = new Date(p.updated_at || p.created_at)
            return d > max ? d : max
          }, new Date(0))
          if (latest.getTime() > 0) {
            this.lastUpdate = this.formatDate(latest.toISOString())
          }
        }

        if (assetsRes.status === 'fulfilled') {
          this.assetCount = assetsRes.value.total
        }

        if (configsRes.status === 'fulfilled') {
          this.configCount = configsRes.value.length
        }
      } catch (err) {
        console.error('[Dashboard] 加载统计数据失败:', err)
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '--'
      const d = new Date(dateStr)
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.shortcut-card {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-3px);
  }
}

.shortcut-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.shortcut-label {
  font-size: 14px;
  color: #606266;
}
</style>
