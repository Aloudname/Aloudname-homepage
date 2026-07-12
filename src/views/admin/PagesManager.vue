<template>
  <div v-loading="loading">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3>📑 页面管理</h3>
      <el-button type="primary" @click="$router.push('/admin/pages/new')">
        <i class="el-icon-plus"></i> 新建页面
      </el-button>
    </div>

    <div class="editor-panel" style="padding:0;">
      <el-table :data="pages" style="width:100%" empty-text="暂无页面，点击右上角新建">
        <el-table-column prop="title" label="标题" min-width="160">
          <template slot-scope="scope">
            <span style="font-weight:600;">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="访问路径" width="200">
          <template slot-scope="scope">
            <el-link type="primary" :href="baseUrl + scope.row.slug" target="_blank" :underline="false">
              /{{ scope.row.slug }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_published ? 'success' : 'info'" size="small">
              {{ scope.row.is_published ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160">
          <template slot-scope="scope">{{ formatDate(scope.row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" @click="$router.push('/admin/pages/' + scope.row.id + '/edit')">编辑</el-button>
            <el-button size="mini" :type="scope.row.is_published ? 'warning' : 'success'"
              @click="togglePublish(scope.row)">{{ scope.row.is_published ? '撤回' : '发布' }}</el-button>
            <el-button size="mini" type="danger" @click="confirmDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { getAllPages, deletePage, togglePagePublish } from '@/services/pagesService'

export default {
  name: 'PagesManager',
  data() {
    return {
      loading: false,
      pages: [],
      baseUrl: location.origin + (location.pathname.includes('github.io')
        ? '/' + location.pathname.split('/')[1] + '/' : '/'),
    }
  },
  async created() { await this.fetch() },
  methods: {
    async fetch() {
      this.loading = true
      try {
        this.pages = await getAllPages()
      } catch (err) {
        this.$message.error('加载失败: ' + err.message)
      } finally {
        this.loading = false
      }
    },
    async togglePublish(p) {
      try {
        await togglePagePublish(p.id, !p.is_published)
        this.$message.success(p.is_published ? '已撤回' : '已发布')
        await this.fetch()
      } catch (err) { this.$message.error(err.message) }
    },
    async confirmDelete(p) {
      try {
        await this.$confirm(`确定删除页面「${p.title}」？`, '警告', { type: 'warning' })
        await deletePage(p.id)
        this.$message.success('已删除')
        await this.fetch()
      } catch (err) {
        if (err !== 'cancel') this.$message.error(err.message)
      }
    },
    formatDate(d) {
      if (!d) return '--'
      return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    },
  },
}
</script>
