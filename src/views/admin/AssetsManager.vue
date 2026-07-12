<!--
  资源管理器
  上传、浏览、搜索、删除图片/视频/音频
-->
<template>
  <div>
    <h3 style="margin-bottom:16px;">🖼️ 资源管理</h3>

    <!-- 上传区域 -->
    <div class="editor-panel">
      <div
        class="upload-zone"
        :class="{ dragover: isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="$refs.fileInput.click()"
      >
        <div class="upload-icon">📤</div>
        <div class="upload-text">
          拖拽文件到此处上传，或点击选择文件<br/>
          <small style="color:#c0c4cc;">支持 JPG/PNG/GIF/WebP/MP4/MP3，单文件最大 50MB</small>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        style="display:none;"
        @change="handleFileInput"
      />

      <!-- 上传进度 -->
      <div v-if="uploading && uploadProgress > 0" style="margin-top:12px;">
        <el-progress :percentage="uploadProgress" :status="uploadProgress === 100 ? 'success' : ''" />
        <span style="font-size:12px;color:#909399;">{{ uploadStatus }}</span>
      </div>
    </div>

    <!-- 筛选 + 搜索 -->
    <div class="editor-panel" style="padding:12px 16px;">
      <el-row :gutter="16" type="flex" align="middle">
        <el-col :span="4">
          <el-radio-group v-model="filterCategory" size="small" @change="fetchAssets">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="image">图片</el-radio-button>
            <el-radio-button label="video">视频</el-radio-button>
            <el-radio-button label="audio">音频</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="6">
          <el-input v-model="search" placeholder="搜索文件名..." size="small" clearable @clear="fetchAssets" @keyup.enter.native="fetchAssets">
            <el-button slot="append" icon="el-icon-search" size="small" @click="fetchAssets" />
          </el-input>
        </el-col>
        <el-col :span="4" :offset="10" style="text-align:right;">
          <el-button
            v-if="selectedIds.length"
            type="danger"
            size="small"
            @click="batchDelete"
          >批量删除 ({{ selectedIds.length }})</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 资源网格 -->
    <div class="asset-grid" v-loading="loading">
      <div
        v-for="asset in assets"
        :key="asset.id"
        class="asset-card"
        :class="{ selected: selectedIds.includes(asset.id) }"
        @click="toggleSelect(asset.id)"
      >
        <!-- 缩略图 -->
        <img
          v-if="asset.category === 'image'"
          :src="asset.public_url"
          :alt="asset.name"
          class="asset-thumb"
          loading="lazy"
        />
        <div v-else-if="asset.category === 'video'" class="asset-thumb">🎬</div>
        <div v-else-if="asset.category === 'audio'" class="asset-thumb">🎵</div>
        <div v-else class="asset-thumb">📄</div>

        <!-- 信息 -->
        <div class="asset-info">
          <div class="asset-name" :title="asset.name">{{ asset.name }}</div>
          <div>{{ formatSize(asset.size_bytes) }}</div>
        </div>

        <!-- 操作 -->
        <div class="asset-actions">
          <el-button size="mini" type="text" @click.stop="copyUrl(asset.public_url)">
            复制 URL
          </el-button>
          <el-button size="mini" type="text" @click.stop="confirmDeleteSingle(asset)" style="color:#f56c6c;">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && assets.length === 0" style="text-align:center;padding:40px;color:#c0c4cc;">
      <div style="font-size:64px;">📭</div>
      <div style="margin-top:12px;">暂无资源，请上传文件</div>
    </div>

    <!-- 分页 -->
    <div style="text-align:center;margin-top:20px;" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
import { getAssets, deleteAsset, batchDeleteAssets } from '@/services/assetsService'

export default {
  name: 'AssetsManager',

  data() {
    return {
      loading: false,
      assets: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      filterCategory: 'all',
      search: '',
      selectedIds: [],
      isDragOver: false,
      uploading: false,
      uploadProgress: 0,
      uploadStatus: '',
    }
  },

  async created() {
    await this.fetchAssets()
  },

  methods: {
    async fetchAssets() {
      this.loading = true
      try {
        const result = await getAssets({
          page: this.currentPage,
          pageSize: this.pageSize,
          category: this.filterCategory,
          search: this.search,
        })
        this.assets = result.assets
        this.total = result.total
      } catch (err) {
        console.error('获取资源列表失败:', err)
      } finally {
        this.loading = false
      }
    },

    handlePageChange(page) {
      this.currentPage = page
      this.fetchAssets()
    },

    toggleSelect(id) {
      const idx = this.selectedIds.indexOf(id)
      if (idx > -1) {
        this.selectedIds.splice(idx, 1)
      } else {
        this.selectedIds.push(id)
      }
    },

    copyUrl(url) {
      navigator.clipboard.writeText(url).then(() => {
        this.$message.success('URL 已复制到剪贴板')
      }).catch(() => {
        this.$message.error('复制失败，请手动复制')
      })
    },

    async handleDrop(e) {
      this.isDragOver = false
      const files = Array.from(e.dataTransfer.files)
      if (files.length) await this.uploadFiles(files)
    },

    async handleFileInput(e) {
      const files = Array.from(e.target.files)
      if (files.length) await this.uploadFiles(files)
      e.target.value = '' // 重置 input
    },

    async uploadFiles(files) {
      this.uploading = true
      this.uploadProgress = 0

      const total = files.length
      let completed = 0

      for (const file of files) {
        // 分类
        let category = 'image'
        if (file.type.startsWith('video/')) category = 'video'
        else if (file.type.startsWith('audio/')) category = 'audio'
        else if (!file.type.startsWith('image/')) category = 'other'

        try {
          const { uploadAsset } = await import('@/services/assetsService')
          await uploadAsset(file, category, [])
          completed++
          this.uploadProgress = Math.round((completed / total) * 100)
          this.uploadStatus = `${completed}/${total} 上传完成`
        } catch (err) {
          console.error(`上传 ${file.name} 失败:`, err)
          this.$message.error(`上传 ${file.name} 失败: ${err.message}`)
        }
      }

      this.uploading = false
      this.$message.success(`成功上传 ${completed}/${total} 个文件`)
      await this.fetchAssets()
    },

    async confirmDeleteSingle(asset) {
      try {
        await this.$confirm(`确定要删除「${asset.name}」吗？`, '确认删除', {
          type: 'warning',
        })
        await deleteAsset(asset.id)
        this.$message.success('已删除')
        await this.fetchAssets()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error('删除失败: ' + err.message)
        }
      }
    },

    async batchDelete() {
      try {
        await this.$confirm(`确定要删除选中的 ${this.selectedIds.length} 个资源吗？`, '批量删除', {
          type: 'warning',
        })
        await batchDeleteAssets(this.selectedIds)
        this.selectedIds = []
        this.$message.success('批量删除成功')
        await this.fetchAssets()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error('删除失败: ' + err.message)
        }
      }
    },

    formatSize(bytes) {
      if (!bytes) return '--'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
    },
  },
}
</script>
