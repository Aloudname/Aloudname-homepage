<!--
  鼠标指针特效编辑器
-->
<template>
  <div class="editor-page" v-loading="loading">
    <h3>🖱️ 鼠标指针编辑</h3>

    <!-- 样式选择 -->
    <div class="editor-panel">
      <div class="panel-title">光标样式</div>
      <el-radio-group v-model="cursorStyle" size="medium">
        <el-radio-button label="default">默认</el-radio-button>
        <el-radio-button label="custom_image">自定义图片</el-radio-button>
        <el-radio-button label="trail">拖尾特效</el-radio-button>
        <el-radio-button label="glow">发光特效</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 自定义光标图片 -->
    <div class="editor-panel" v-if="cursorStyle === 'custom_image'">
      <div class="panel-title">光标图片</div>
      <p style="color:#909399;font-size:12px;margin-bottom:12px;">
        推荐使用 32x32 或 64x64 的 PNG 图片（支持透明通道）
      </p>
      <el-input v-model="cursorImageUrl" placeholder="输入光标图片 URL">
        <el-button slot="append" @click="showAssetPicker = true">选择资源</el-button>
      </el-input>
      <div v-if="cursorImageUrl" style="margin-top:12px;">
        <span>预览: </span>
        <img :src="cursorImageUrl" style="width:32px;height:32px;vertical-align:middle;" />
      </div>
    </div>

    <!-- 拖尾特效参数 -->
    <div class="editor-panel" v-if="cursorStyle === 'trail'">
      <div class="panel-title">拖尾参数</div>
      <el-form label-position="left" label-width="100px">
        <el-form-item label="拖尾长度">
          <el-slider v-model="trailConfig.length" :min="3" :max="30" show-input />
        </el-form-item>
        <el-form-item label="粒子大小">
          <el-slider v-model="trailConfig.size" :min="2" :max="20" show-input />
        </el-form-item>
        <el-form-item label="拖尾颜色">
          <el-color-picker v-model="trailConfig.color" />
        </el-form-item>
        <el-form-item label="衰减速度">
          <el-slider v-model="trailConfig.fadeSpeed" :min="0.01" :max="0.2" :step="0.01" show-input />
        </el-form-item>
      </el-form>
    </div>

    <!-- 发光特效参数 -->
    <div class="editor-panel" v-if="cursorStyle === 'glow'">
      <div class="panel-title">发光参数</div>
      <el-form label-position="left" label-width="100px">
        <el-form-item label="光晕半径">
          <el-slider v-model="glowConfig.radius" :min="10" :max="100" show-input />
        </el-form-item>
        <el-form-item label="发光颜色">
          <el-color-picker v-model="glowConfig.color" show-alpha />
        </el-form-item>
        <el-form-item label="模糊程度">
          <el-slider v-model="glowConfig.blur" :min="0" :max="40" show-input />
        </el-form-item>
      </el-form>
    </div>

    <!-- 保存 -->
    <div class="editor-panel" style="text-align:right;">
      <el-button @click="loadConfig">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">💾 保存配置</el-button>
    </div>

    <!-- 资源选择器 -->
    <el-dialog title="选择光标图片" :visible.sync="showAssetPicker" width="700px" :append-to-body="true">
      <AssetPicker category="image" @select="onAssetSelected" />
    </el-dialog>
  </div>
</template>

<script>
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'

export default {
  name: 'CursorEditor',

  data() {
    return {
      loading: false,
      saving: false,
      cursorStyle: 'default',
      cursorImageUrl: '',
      trailConfig: { length: 10, size: 8, color: '#ff6b9d', fadeSpeed: 0.05 },
      glowConfig: { radius: 40, color: 'rgba(100,200,255,0.5)', blur: 20 },
      showAssetPicker: false,
    }
  },

  async created() {
    await this.loadConfig()
  },

  methods: {
    async loadConfig() {
      this.loading = true
      try {
        const config = await getSectionConfig('cursor')
        if (config.style) this.cursorStyle = config.style
        if (config.image_url) this.cursorImageUrl = config.image_url
        if (config.trail_config) this.trailConfig = { ...this.trailConfig, ...config.trail_config }
        if (config.glow_config) this.glowConfig = { ...this.glowConfig, ...config.glow_config }
      } catch (err) {
        console.error('加载光标配置失败:', err)
      } finally {
        this.loading = false
      }
    },

    onAssetSelected(asset) {
      this.cursorImageUrl = asset.public_url
      this.showAssetPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        const configs = [
          { section: 'cursor', key: 'style', value: this.cursorStyle },
        ]
        if (this.cursorStyle === 'custom_image') {
          configs.push({ section: 'cursor', key: 'image_url', value: this.cursorImageUrl })
        }
        if (this.cursorStyle === 'trail') {
          configs.push({ section: 'cursor', key: 'trail_config', value: this.trailConfig })
        }
        if (this.cursorStyle === 'glow') {
          configs.push({ section: 'cursor', key: 'glow_config', value: this.glowConfig })
        }

        await batchUpsertConfigs(configs)
        pageConfigStore.invalidateSection('cursor')
        this.$message.success('光标配置已保存')
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
