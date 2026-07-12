<template>
  <div class="editor-page" v-loading="loading">
    <h3>🌄 动态背景编辑</h3>
    <p style="color:#909399;margin-bottom:16px;">勾选需要的背景图层，可多选叠加。每层有独立的透明度。</p>

    <!-- ====== 图层1: 静态图片 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        <el-checkbox v-model="layers.image.enabled">🖼️ 静态图片</el-checkbox>
      </div>
      <template v-if="layers.image.enabled">
        <el-input v-model="layers.image.url" placeholder="背景图 URL" style="margin-bottom:10px;">
          <el-button slot="append" @click="openAssetPicker('image')">选择资源</el-button>
        </el-input>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="cfg-label">透明度</div>
            <el-slider v-model="layers.image.opacity" :min="0" :max="1" :step="0.05" show-input />
          </el-col>
          <el-col :span="12">
            <div class="cfg-label">平移速度 <span style="font-size:11px;color:#c0c4cc;">(0=静止)</span></div>
            <el-slider v-model="layers.image.panSpeed" :min="0" :max="3" :step="0.1" show-input />
          </el-col>
        </el-row>
      </template>
    </div>

    <!-- ====== 图层2: Banner 图 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        <el-checkbox v-model="layers.banner.enabled">🏠 Banner 图</el-checkbox>
      </div>
      <template v-if="layers.banner.enabled">
        <el-input v-model="layers.banner.url" placeholder="Banner 背景图 URL" style="margin-bottom:10px;">
          <el-button slot="append" @click="openAssetPicker('banner')">选择资源</el-button>
        </el-input>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="cfg-label">透明度</div>
            <el-slider v-model="layers.banner.opacity" :min="0" :max="1" :step="0.05" show-input />
          </el-col>
          <el-col :span="12">
            <div class="cfg-label">平移速度 <span style="font-size:11px;color:#c0c4cc;">(0=静止)</span></div>
            <el-slider v-model="layers.banner.panSpeed" :min="0" :max="3" :step="0.1" show-input />
          </el-col>
        </el-row>
      </template>
    </div>

    <!-- ====== 图层3: 视频 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        <el-checkbox v-model="layers.video.enabled">🎬 视频背景</el-checkbox>
      </div>
      <template v-if="layers.video.enabled">
        <el-input v-model="layers.video.url" placeholder="视频 URL">
          <el-button slot="append" @click="openAssetPicker('video')">选择资源</el-button>
        </el-input>
        <div class="cfg-label" style="margin-top:10px;">透明度</div>
        <el-slider v-model="layers.video.opacity" :min="0" :max="1" :step="0.05" show-input />
      </template>
    </div>

    <!-- ====== 图层4: 渐变 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        <el-checkbox v-model="layers.gradient.enabled">🌈 渐变色</el-checkbox>
      </div>
      <template v-if="layers.gradient.enabled">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-color-picker v-model="layers.gradient.colors[0]" size="small" />
          </el-col>
          <el-col :span="8">
            <el-color-picker v-model="layers.gradient.colors[1]" size="small" />
          </el-col>
          <el-col :span="8">
            <el-color-picker v-model="layers.gradient.colors[2]" size="small" />
            <span style="font-size:10px;color:#c0c4cc;">可选</span>
          </el-col>
        </el-row>
        <div class="cfg-label" style="margin-top:10px;">透明度</div>
        <el-slider v-model="layers.gradient.opacity" :min="0" :max="1" :step="0.05" show-input />
      </template>
    </div>

    <!-- ====== 图层5: 基础粒子 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        <el-checkbox v-model="layers.basicParticles.enabled">✨ 基础粒子（连线网络）</el-checkbox>
      </div>
      <template v-if="layers.basicParticles.enabled">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="cfg-label">粒子数量</div>
            <el-slider v-model="layers.basicParticles.count" :min="10" :max="300" show-input />
          </el-col>
          <el-col :span="12">
            <div class="cfg-label">透明度</div>
            <el-slider v-model="layers.basicParticles.opacity" :min="0" :max="1" :step="0.05" show-input />
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top:8px;">
          <el-col :span="8">
            <div class="cfg-label">颜色</div>
            <el-color-picker v-model="layers.basicParticles.color" size="small" />
          </el-col>
          <el-col :span="8">
            <div class="cfg-label">速度</div>
            <el-slider v-model="layers.basicParticles.speed" :min="0.5" :max="5" :step="0.1" show-input />
          </el-col>
          <el-col :span="8">
            <div class="cfg-label">形状</div>
            <el-radio-group v-model="layers.basicParticles.shape" size="mini">
              <el-radio label="circle">圆</el-radio>
              <el-radio label="square">方</el-radio>
            </el-radio-group>
          </el-col>
        </el-row>
        <div class="cfg-label" style="margin-top:8px;">连线距离</div>
        <el-slider v-model="layers.basicParticles.connectDistance" :min="50" :max="300" show-input />
      </template>
    </div>

    <!-- ====== 图层6: 高级粒子 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        <el-checkbox v-model="layers.advancedParticles.enabled">🪐 高级粒子（天体物理 + 鼠标引力）</el-checkbox>
      </div>
      <template v-if="layers.advancedParticles.enabled">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="cfg-label">最大粒子数</div>
            <el-slider v-model="layers.advancedParticles.maxCount" :min="10" :max="200" show-input />
          </el-col>
          <el-col :span="12">
            <div class="cfg-label">透明度</div>
            <el-slider v-model="layers.advancedParticles.opacity" :min="0" :max="1" :step="0.05" show-input />
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top:8px;">
          <el-col :span="8">
            <div class="cfg-label">粒子质量</div>
            <el-slider v-model="layers.advancedParticles.particleMass" :min="0.1" :max="5" :step="0.1" show-input />
          </el-col>
          <el-col :span="8">
            <div class="cfg-label">鼠标质量</div>
            <el-slider v-model="layers.advancedParticles.cursorMass" :min="10" :max="200" :step="5" show-input />
          </el-col>
          <el-col :span="8">
            <div class="cfg-label">粒子大小</div>
            <el-slider v-model="layers.advancedParticles.size" :min="1" :max="12" :step="0.5" show-input />
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top:8px;">
          <el-col :span="8">
            <div class="cfg-label">引力范围</div>
            <el-slider v-model="layers.advancedParticles.gravityRange" :min="50" :max="500" show-input />
          </el-col>
          <el-col :span="8">
            <div class="cfg-label">引力强度</div>
            <el-slider v-model="layers.advancedParticles.gravityStrength" :min="0.1" :max="3" :step="0.1" show-input />
          </el-col>
          <el-col :span="8">
            <div class="cfg-label">拖尾长度</div>
            <el-slider v-model="layers.advancedParticles.trailLength" :min="0" :max="15" :step="1" show-input />
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top:8px;">
          <el-col :span="12">
            <div class="cfg-label">生成速率 <span style="font-size:11px;color:#c0c4cc;">(每秒粒子数)</span></div>
            <el-slider v-model="layers.advancedParticles.spawnRate" :min="0.1" :max="5" :step="0.1" show-input />
          </el-col>
          <el-col :span="12">
            <div class="cfg-label">颜色</div>
            <el-color-picker v-model="layers.advancedParticles.color" size="small" />
          </el-col>
        </el-row>
      </template>
    </div>

    <!-- ====== 全局遮罩 ====== -->
    <div class="editor-panel">
      <div class="panel-title">全局遮罩</div>
      <el-slider v-model="overlayOpacity" :min="0" :max="1" :step="0.05" show-input />
      <span style="color:#909399;font-size:12px;">值越大画面越暗</span>
    </div>

    <!-- ====== 保存 ====== -->
    <div class="editor-panel" style="text-align:right;">
      <el-button @click="loadConfig">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">💾 保存配置</el-button>
    </div>

    <!-- 资源选择器 -->
    <el-dialog title="选择资源" :visible.sync="showAssetPicker" width="700px" :append-to-body="true">
      <AssetPicker :category="assetPickCategory" @select="onAssetSelected" />
    </el-dialog>
  </div>
</template>

<script>
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'

const DEFAULT_LAYERS = {
  image: { enabled: true, url: '', opacity: 1, panSpeed: 0 },
  banner: { enabled: false, url: '', opacity: 1, panSpeed: 0 },
  video: { enabled: false, url: '', opacity: 1 },
  gradient: { enabled: false, colors: ['#667eea', '#764ba2', ''], opacity: 1 },
  basicParticles: { enabled: false, opacity: 1, count: 80, color: '#ffffff', speed: 1.5, shape: 'circle', connectDistance: 150, maxRadius: 3 },
  advancedParticles: { enabled: false, opacity: 1, maxCount: 60, spawnRate: 0.5, particleMass: 1, cursorMass: 50, gravityRange: 200, gravityStrength: 0.5, size: 4, color: '#ff6b9d', trailLength: 5 },
}

export default {
  name: 'BackgroundEditor',
  data() {
    return {
      loading: false,
      saving: false,
      layers: JSON.parse(JSON.stringify(DEFAULT_LAYERS)),
      overlayOpacity: 0.4,
      showAssetPicker: false,
      assetPickCategory: 'image',
      assetPickTarget: 'image', // 告诉回调更新哪个字段
    }
  },

  async created() { await this.loadConfig() },

  methods: {
    async loadConfig() {
      this.loading = true
      try {
        const config = await getSectionConfig('background')
        if (config.layers) {
          for (const key of Object.keys(DEFAULT_LAYERS)) {
            if (config.layers[key]) {
              this.layers[key] = { ...this.layers[key], ...config.layers[key] }
            }
          }
        } else if (config.type) {
          // 兼容旧版配置
          if (config.type === 'image') {
            this.layers.image.enabled = true
            if (config.image_url) this.layers.image.url = config.image_url
          } else if (config.type === 'video') {
            this.layers.video.enabled = true
            if (config.video_url) this.layers.video.url = config.video_url
          } else if (config.type === 'particles' && config.particle_config) {
            this.layers.basicParticles.enabled = true
            Object.assign(this.layers.basicParticles, config.particle_config)
          } else if (config.type === 'gradient') {
            this.layers.gradient.enabled = true
            if (config.gradient_colors) this.layers.gradient.colors = config.gradient_colors
          }
        }
        if (config.overlay_opacity !== undefined) this.overlayOpacity = config.overlay_opacity
      } catch (err) {
        console.error('加载背景配置失败:', err)
      } finally {
        this.loading = false
      }
    },

    openAssetPicker(target) {
      this.assetPickTarget = target // 'image' | 'banner' | 'video'
      this.assetPickCategory = target === 'video' ? 'video' : 'image'
      this.showAssetPicker = true
    },

    onAssetSelected(asset) {
      const t = this.assetPickTarget
      if (t === 'video') this.layers.video.url = asset.public_url
      else if (t === 'banner') this.layers.banner.url = asset.public_url
      else this.layers.image.url = asset.public_url
      this.showAssetPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        // 过滤掉空色值的渐变色
        const layersToSave = JSON.parse(JSON.stringify(this.layers))
        layersToSave.gradient.colors = layersToSave.gradient.colors.filter(Boolean)

        await batchUpsertConfigs([
          { section: 'background', key: 'layers', value: layersToSave },
          { section: 'background', key: 'overlay_opacity', value: this.overlayOpacity },
        ])
        pageConfigStore.invalidateSection('background')
        this.$message.success('背景配置已保存')
      } catch (err) {
        this.$message.error('保存失败: ' + err.message)
      } finally {
        this.saving = false
      }
    },
  },

  components: { AssetPicker: () => import('./components/AssetPicker.vue') },
}
</script>

<style scoped>
.cfg-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}
</style>
