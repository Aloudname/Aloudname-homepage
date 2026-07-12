<!--
  博客文章管理页
-->
<template>
  <div v-loading="loading">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3>📄 文章管理</h3>
      <el-button type="primary" @click="$router.push('/admin/posts/new')">
        <i class="el-icon-plus"></i> 新建文章
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="editor-panel" style="padding:12px 16px;">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input v-model="search" placeholder="搜索文章标题..." size="small" clearable @clear="fetchPosts" @keyup.enter.native="fetchPosts">
            <el-button slot="append" icon="el-icon-search" size="small" @click="fetchPosts" />
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterStatus" placeholder="状态" size="small" clearable @change="fetchPosts">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <!-- 文章列表 -->
    <div class="editor-panel" style="padding:0;">
      <el-table :data="posts" style="width:100%">
        <el-table-column prop="title" label="标题" min-width="200">
          <template slot-scope="scope">
            <span style="font-weight:600;">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="标签" width="180">
          <template slot-scope="scope">
            <el-tag
              v-for="tag in (scope.row.tags || [])"
              :key="tag"
              size="mini"
              style="margin-right:4px;"
            >{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.is_published ? 'success' : 'info'"
              size="small"
            >{{ scope.row.is_published ? '已发布' : '草稿' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160">
          <template slot-scope="scope">
            {{ formatDate(scope.row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" @click="editPost(scope.row.id)">编辑</el-button>
            <el-button
              size="mini"
              :type="scope.row.is_published ? 'warning' : 'success'"
              @click="togglePublishPost(scope.row)"
            >{{ scope.row.is_published ? '撤回' : '发布' }}</el-button>
            <el-button size="mini" type="danger" @click="confirmDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { getAllPosts, deletePost, togglePublish } from '@/services/postsService'

export default {
  name: 'PostsManager',

  data() {
    return {
      loading: false,
      posts: [],
      search: '',
      filterStatus: '',
    }
  },

  async created() {
    await this.fetchPosts()
  },

  methods: {
    async fetchPosts() {
      this.loading = true
      try {
        let list = await getAllPosts()

        // 前端筛选
        if (this.search) {
          const kw = this.search.toLowerCase()
          list = list.filter(p => p.title?.toLowerCase().includes(kw))
        }
        if (this.filterStatus === 'published') {
          list = list.filter(p => p.is_published)
        } else if (this.filterStatus === 'draft') {
          list = list.filter(p => !p.is_published)
        }

        this.posts = list
      } catch (err) {
        console.error('获取文章列表失败:', err)
        this.$message.error('获取文章列表失败')
      } finally {
        this.loading = false
      }
    },

    editPost(id) {
      this.$router.push(`/admin/posts/${id}/edit`)
    },

    async togglePublishPost(post) {
      try {
        await togglePublish(post.id, !post.is_published)
        this.$message.success(post.is_published ? '文章已撤回' : '文章已发布')
        await this.fetchPosts()
      } catch (err) {
        this.$message.error('操作失败: ' + err.message)
      }
    },

    async confirmDelete(post) {
      try {
        await this.$confirm(`确定要删除文章「${post.title}」吗？此操作不可恢复。`, '警告', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await deletePost(post.id)
        this.$message.success('文章已删除')
        await this.fetchPosts()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error('删除失败: ' + err.message)
        }
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '--'
      const d = new Date(dateStr)
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    },
  },
}
</script>
