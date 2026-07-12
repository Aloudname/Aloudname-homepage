<!--
  资源选择器弹窗组件
  用于编辑器中选择已上传的资源（图片/视频/音频）
  通过 事件 'select' 返回选中的 asset 对象
-->
<template>
  <div class="asset-picker">
    <!-- 分类筛选 -->
    <el-radio-group v-model="filterCategory" size="small" @change="fetchAssets" style="margin-bottom:12px;">
      <el-radio-button label="all">全部</el-radio-button>
      <el-radio-button label="image">图片</el-radio-button>
      <el-radio-button label="video">视频</el-radio-button>
      <el-radio-button label="audio">音频</el-radio-button>
    </el-radio-group>

    <!-- 搜索 -->
    <el-input
      v-model="search"
      placeholder="搜索资源..."
      size="small"
      clearable
      @clear="fetchAssets"
      @keyup.enter.native="fetchAssets"
      style="margin-bottom:12px;"
    >
      <el-button slot="append" icon="el-icon-search" size="small" @click="fetchAssets" />
    </el-input>

    <!-- 资源网格 -->
    <div v-loading="loading" class="picker-grid">
      <div
        v-for="asset in assets"
        :key="asset.id"
        class="picker-item"
        :class="{ selected: selectedId === asset.id }"
        @click="selectedId = asset.id"
        @dblclick="confirmSelect"
      >
        <img
          v-if="asset.category === 'image'"
          :src="asset.public_url"
          :alt="asset.name"
          class="picker-thumb"
        />
        <div v-else-if="asset.category === 'video'" class="picker-thumb picker-icon">🎬</div>
        <div v-else-if="asset.category === 'audio'" class="picker-thumb picker-icon">🎵</div>
        <div v-else class="picker-thumb picker-icon">📄</div>
        <div class="picker-name">{{ asset.name }}</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && assets.length === 0" style="text-align:center;padding:30px;color:#c0c4cc;">
      暂无资源
    </div>

    <!-- 分页 -->
    <div style="text-align:center;margin-top:12px;" v-if="total > pageSize">
      <el-pagination
        small
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 底部按钮 -->
    <div style="text-align:right;margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" :disabled="!selectedId" @click="confirmSelect">
        确认选择
      </el-button>
    </div>
  </div>
</template>

<script>
import { getAssets } from '@/services/assetsService'

export default {
  name: 'AssetPicker',

  props: {
    category: {
      type: String,
      default: 'all',
    },
  },

  data() {
    return {
      loading: false,
      assets: [],
      total: 0,
      currentPage: 1,
      pageSize: 12,
      filterCategory: this.category || 'all',
      search: '',
      selectedId: null,
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
        console.error('加载资源失败:', err)
      } finally {
        this.loading = false
      }
    },

    handlePageChange(page) {
      this.currentPage = page
      this.fetchAssets()
    },

    confirmSelect() {
      const selected = this.assets.find(a => a.id === this.selectedId)
      if (selected) {
        this.$emit('select', selected)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
}

.picker-item {
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
  background: #fafafa;

  &:hover {
    border-color: #c0c4cc;
  }

  &.selected {
    border-color: #42b983;
    box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
  }
}

.picker-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6f8;
}

.picker-icon {
  font-size: 32px;
}

.picker-name {
  padding: 4px 8px;
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
