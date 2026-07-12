<!--
  动态背景编辑器
  选择背景类型 + 配置参数 + 实时预览 + 保存
-->
<template>
  <div class="editor-page" v-loading="loading">
    <h3>🌄 动态背景编辑</h3>

    <!-- 背景类型选择 -->
    <div class="editor-panel">
      <div class="panel-title">背景类型</div>
      <el-radio-group v-model="bgType" size="medium">
        <el-radio-button label="image">🖼️ 静态图片</el-radio-button>
        <el-radio-button label="video">🎬 视频背景</el-radio-button>
        <el-radio-button label="particles">✨ 粒子特效</el-radio-button>
        <el-radio-button label="gradient">🌈 渐变色</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 静态图片配置 -->
    <div class="editor-panel" v-if="bgType === 'image'">
      <div class="panel-title">背景图片</div>
      <el-input v-model="imageUrl" placeholder="输入图片 URL 或点击选择已上传资源">
        <el-button slot="append" @click="showAssetPicker = true">选择资源</el-button>
      </el-input>
      <div class="preview-thumb" v-if="imageUrl">
        <img :src="imageUrl" alt="preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-top: 12px;" />
      </div>
    </div>

    <!-- 视频背景配置 -->
    <div class="editor-panel" v-if="bgType === 'video'">
      <div class="panel-title">背景视频</div>
      <el-input v-model="videoUrl" placeholder="输入视频 URL 或点击选择已上传资源">
        <el-button slot="append" @click="showAssetPicker = true; assetPickCategory = 'video'">选择资源</el-button>
      </el-input>
    </div>

    <!-- 粒子特效配置 -->
    <div class="editor-panel" v-if="bgType === 'particles'">
      <div class="panel-title">粒子参数</div>
      <el-form label-position="left" label-width="120px">
        <el-form-item label="粒子数量">
          <el-slider v-model="particleConfig.count" :min="10" :max="300" show-input />
        </el-form-item>
        <el-form-item label="粒子颜色">
          <el-color-picker v-model="particleConfig.color" />
        </el-form-item>
        <el-form-item label="移动速度">
          <el-slider v-model="particleConfig.speed" :min="0.5" :max="5" :step="0.1" show-input />
        </el-form-item>
        <el-form-item label="粒子形状">
          <el-radio-group v-model="particleConfig.shape">
            <el-radio label="circle">圆形</el-radio>
            <el-radio label="square">方形</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="连线距离">
          <el-slider v-model="particleConfig.connectDistance" :min="50" :max="300" show-input />
        </el-form-item>
      </el-form>
    </div>

    <!-- 渐变色配置 -->
    <div class="editor-panel" v-if="bgType === 'gradient'">
      <div class="panel-title">渐变色</div>
      <el-form label-position="left" label-width="80px">
        <el-form-item label="颜色1">
          <el-color-picker v-model="gradientColors[0]" />
        </el-form-item>
        <el-form-item label="颜色2">
          <el-color-picker v-model="gradientColors[1]" />
        </el-form-item>
        <el-form-item label="颜色3">
          <el-color-picker v-model="gradientColors[2]" />
          <span style="color: #909399; margin-left: 8px; font-size: 12px;">可选</span>
        </el-form-item>
      </el-form>
    </div>

    <!-- 遮罩透明度（所有类型通用） -->
    <div class="editor-panel">
      <div class="panel-title">遮罩透明度</div>
      <el-slider v-model="overlayOpacity" :min="0" :max="1" :step="0.05" show-input />
      <span style="color:#909399;font-size:12px;">值越大越暗，0为无遮罩</span>
    </div>

    <!-- 实时预览 -->
    <div class="editor-panel">
      <div class="panel-title">
        实时预览
        <el-button size="mini" type="text" @click="refreshPreview">🔄 刷新</el-button>
      </div>
      <div class="preview-area">
        <iframe
          ref="previewFrame"
          :src="previewUrl"
          frameborder="0"
          style="width:100%;height:400px;"
        />
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="editor-panel" style="text-align: right;">
      <el-button @click="resetForm">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">💾 保存配置</el-button>
    </div>

    <!-- 资源选择器弹窗 -->
    <el-dialog
      title="选择资源"
      :visible.sync="showAssetPicker"
      width="700px"
      :append-to-body="true"
    >
      <AssetPicker
        :category="assetPickCategory"
        @select="onAssetSelected"
      />
    </el-dialog>
  </div>
</template>

<script>
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'

export default {
  name: 'BackgroundEditor',

  data() {
    return {
      loading: false,
      saving: false,
      bgType: 'image',
      imageUrl: '',
      videoUrl: '',
      particleConfig: {
        count: 80,
        color: '#ffffff',
        speed: 1.5,
        shape: 'circle',
        connectDistance: 150,
      },
      gradientColors: ['#667eea', '#764ba2', ''],
      overlayOpacity: 0.4,
      showAssetPicker: false,
      assetPickCategory: 'image',
    }
  },

  computed: {
    previewUrl() {
      // 预览 iframe 指向预览路由（简单的空白页面渲染背景组件）
      return `/preview.html?t=${Date.now()}`
    },
  },

  async created() {
    await this.loadConfig()
  },

  methods: {
    async loadConfig() {
      this.loading = true
      try {
        const config = await getSectionConfig('background')
        if (config.type) this.bgType = config.type
        if (config.image_url) this.imageUrl = config.image_url
        if (config.video_url) this.videoUrl = config.video_url
        if (config.particle_config) {
          this.particleConfig = { ...this.particleConfig, ...config.particle_config }
        }
        if (config.gradient_colors) {
          this.gradientColors = config.gradient_colors
        }
        if (config.overlay_opacity !== undefined && config.overlay_opacity !== null) {
          this.overlayOpacity = config.overlay_opacity
        }
      } catch (err) {
        console.error('加载背景配置失败:', err)
      } finally {
        this.loading = false
      }
    },

    onAssetSelected(asset) {
      if (this.assetPickCategory === 'video') {
        this.videoUrl = asset.public_url
      } else {
        this.imageUrl = asset.public_url
      }
      this.showAssetPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        const configs = [
          { section: 'background', key: 'type', value: this.bgType },
          { section: 'background', key: 'overlay_opacity', value: this.overlayOpacity },
        ]

        if (this.bgType === 'image') {
          configs.push({ section: 'background', key: 'image_url', value: this.imageUrl })
        }
        if (this.bgType === 'video') {
          configs.push({ section: 'background', key: 'video_url', value: this.videoUrl })
        }
        if (this.bgType === 'particles') {
          configs.push({ section: 'background', key: 'particle_config', value: this.particleConfig })
        }
        if (this.bgType === 'gradient') {
          const colors = this.gradientColors.filter(Boolean)
          configs.push({ section: 'background', key: 'gradient_colors', value: colors })
        }

        await batchUpsertConfigs(configs)
        pageConfigStore.invalidateSection('background')
        this.$message.success('背景配置已保存')
      } catch (err) {
        this.$message.error('保存失败: ' + err.message)
      } finally {
        this.saving = false
      }
    },

    resetForm() {
      this.loadConfig()
    },

    refreshPreview() {
      if (this.$refs.previewFrame) {
        this.$refs.previewFrame.src = this.previewUrl
      }
    },
  },

  components: {
    AssetPicker: () => import('./components/AssetPicker.vue'),
  },
}
</script>
