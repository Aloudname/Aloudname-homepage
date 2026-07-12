<!--
  背景音乐编辑器
-->
<template>
  <div class="editor-page" v-loading="loading">
    <h3>🎵 背景音乐编辑</h3>

    <!-- 启用开关 -->
    <div class="editor-panel">
      <div class="panel-title">音乐播放</div>
      <el-switch v-model="enabled" active-text="启用" inactive-text="停用" />
    </div>

    <!-- 播放列表管理 -->
    <div class="editor-panel" v-if="enabled">
      <div class="panel-title">
        播放列表
        <el-button size="small" type="primary" @click="addTrack" style="float:right;">+ 添加歌曲</el-button>
      </div>

      <el-table :data="playlist" style="width:100%">
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="歌曲名称" prop="name">
          <template slot-scope="scope">
            <el-input v-model="scope.row.name" placeholder="歌曲名称" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="音乐 URL" prop="url">
          <template slot-scope="scope">
            <el-input v-model="scope.row.url" placeholder="输入音频 URL 或选择资源" size="small">
              <el-button slot="append" size="mini" @click="pickForIndex(scope.$index)">选择</el-button>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeTrack(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 自动播放 -->
    <div class="editor-panel" v-if="enabled">
      <div class="panel-title">自动播放</div>
      <el-switch v-model="autoplay" active-text="开启" inactive-text="关闭" />
      <p style="color:#909399;font-size:12px;margin-top:8px;">
        注意：部分浏览器可能阻止自动播放音频
      </p>
    </div>

    <!-- 保存 -->
    <div class="editor-panel" style="text-align:right;">
      <el-button @click="loadConfig">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">💾 保存配置</el-button>
    </div>

    <!-- 资源选择器 -->
    <el-dialog title="选择音频文件" :visible.sync="showAssetPicker" width="700px" :append-to-body="true">
      <AssetPicker category="audio" @select="onAssetSelected" />
    </el-dialog>
  </div>
</template>

<script>
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'

export default {
  name: 'MusicEditor',

  data() {
    return {
      loading: false,
      saving: false,
      enabled: true,
      autoplay: true,
      playlist: [],
      showAssetPicker: false,
      pickIndex: 0,
    }
  },

  async created() {
    await this.loadConfig()
  },

  methods: {
    async loadConfig() {
      this.loading = true
      try {
        const config = await getSectionConfig('music')
        if (config.enabled !== undefined) this.enabled = config.enabled
        if (config.autoplay !== undefined) this.autoplay = config.autoplay
        if (config.playlist) this.playlist = config.playlist
      } catch (err) {
        console.error('加载音乐配置失败:', err)
      } finally {
        this.loading = false
      }
    },

    addTrack() {
      this.playlist.push({ name: '', url: '' })
    },

    removeTrack(index) {
      this.playlist.splice(index, 1)
    },

    pickForIndex(index) {
      this.pickIndex = index
      this.showAssetPicker = true
    },

    onAssetSelected(asset) {
      if (this.playlist[this.pickIndex]) {
        this.playlist[this.pickIndex].url = asset.public_url
        if (!this.playlist[this.pickIndex].name) {
          this.playlist[this.pickIndex].name = asset.name
        }
      }
      this.showAssetPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        await batchUpsertConfigs([
          { section: 'music', key: 'enabled', value: this.enabled },
          { section: 'music', key: 'autoplay', value: this.autoplay },
          { section: 'music', key: 'playlist', value: this.playlist.filter(t => t.name || t.url) },
        ])
        pageConfigStore.invalidateSection('music')
        this.$message.success('音乐配置已保存')
      } catch (err) {
        this.$message.error('保存失败: ' + err.message)
      } finally {
        this.saving = false
      }
    },
  },

  components: {
    AssetPicker: () => import('./components/AssetPicker.vue'),
  },
}
</script>
