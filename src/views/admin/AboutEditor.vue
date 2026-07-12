<template>
  <div class="editor-page" v-loading="loading">
    <h3>📖 关于页编辑</h3>

    <!-- ====== Banner ====== -->
    <div class="editor-panel">
      <div class="panel-title">🏠 Banner 设置</div>
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="背景图片 URL">
              <el-input v-model="form.banner_image" placeholder="Banner 背景图">
                <el-button slot="append" @click="openPicker('banner')">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标题文字">
              <el-input v-model="form.banner_title" placeholder="如: 关于我" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- ====== 侧边栏 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        侧边栏设置
        <el-switch v-model="form.sidebar_visible" active-text="显示" inactive-text="隐藏"
          style="margin-left:16px;" />
      </div>
      <template v-if="form.sidebar_visible">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="头像 URL">
              <el-input v-model="form.sidebar_avatar" placeholder="头像图片">
                <el-button slot="append" @click="openPicker('avatar')">选</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="头像大小">
              <el-slider v-model="form.sidebar_avatar_size" :min="50" :max="150" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="昵称">
              <el-input v-model="form.sidebar_name" placeholder="侧边栏昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="简介">
              <el-input v-model="form.sidebar_bio" placeholder="一句话简介" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" style="margin-top:8px;">
          <el-col :span="12">
            <el-form-item label="底部分隔符 emoji">
              <el-input v-model="form.sidebar_divider" placeholder="如: 🌴" maxlength="4" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="底部装饰图 URL">
              <el-input v-model="form.sidebar_bottom_img" placeholder="侧边栏底部 GIF 图">
                <el-button slot="append" @click="openPicker('bottom')">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </div>

    <!-- ====== 页面背景 ====== -->
    <div class="editor-panel">
      <div class="panel-title">🎨 页面背景</div>
      <el-row :gutter="16">
        <el-col :span="16">
          <el-form-item label="背景图 URL（可选）">
            <el-input v-model="form.page_bg_image" placeholder="留空则使用默认">
              <el-button slot="append" @click="openPicker('pagebg')">选择</el-button>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="背景图透明度">
            <el-slider v-model="form.page_bg_opacity" :min="0" :max="1" :step="0.05" show-input />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- ====== 返回顶部按钮 ====== -->
    <div class="editor-panel">
      <div class="panel-title">
        返回顶部按钮
        <el-switch v-model="form.backtop_visible" active-text="显示" inactive-text="隐藏"
          style="margin-left:16px;" />
      </div>
      <template v-if="form.backtop_visible">
        <el-form-item label="按钮图标 URL">
          <el-input v-model="form.backtop_icon" placeholder="返回顶部图标">
            <el-button slot="append" @click="openPicker('backtop')">选择</el-button>
          </el-input>
        </el-form-item>
      </template>
    </div>

    <!-- ====== Markdown 内容 ====== -->
    <div class="editor-panel">
      <div class="panel-title">📝 页面内容（Markdown）</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-input v-model="form.markdown_content" type="textarea" :rows="18"
            placeholder="支持 Markdown 语法编写内容..." style="font-family:monospace;font-size:14px;" />
        </el-col>
        <el-col :span="12">
          <div class="markdown-body"
               style="padding:12px;background:#fafafa;border-radius:8px;text-align:left;height:100%;min-height:380px;overflow-y:auto;">
            <VueMarkdown v-if="form.markdown_content" :source="form.markdown_content" />
            <span v-else style="color:#c0c4cc;">输入 Markdown 后此处实时预览</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- ====== 保存 ====== -->
    <div class="editor-panel" style="text-align:right;">
      <el-button @click="loadConfig">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">💾 保存</el-button>
    </div>

    <!-- 资源选择器 -->
    <el-dialog title="选择资源" :visible.sync="showPicker" width="700px" :append-to-body="true">
      <AssetPicker category="image" @select="onAssetPicked" />
    </el-dialog>
  </div>
</template>

<script>
import VueMarkdown from 'vue-markdown'
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'
import 'highlight.js/styles/github.css'
import 'github-markdown-css'

export default {
  name: 'AboutEditor',
  components: { VueMarkdown, AssetPicker: () => import('./components/AssetPicker.vue') },

  data() {
    return {
      loading: false, saving: false, showPicker: false, pickTarget: '',
      form: {
        banner_image: '', banner_title: '',
        sidebar_visible: true, sidebar_avatar: '', sidebar_avatar_size: 90,
        sidebar_name: '', sidebar_bio: '', sidebar_divider: '🌴', sidebar_bottom_img: '',
        page_bg_image: '', page_bg_opacity: 0.15,
        backtop_visible: true, backtop_icon: '',
        markdown_content: '',
      },
    }
  },

  async created() { await this.loadConfig() },

  methods: {
    async loadConfig() {
      this.loading = true
      try {
        const cfg = await getSectionConfig('about')
        const keys = Object.keys(this.form)
        for (const k of keys) {
          if (cfg[k] !== undefined && cfg[k] !== null) this.form[k] = cfg[k]
        }
      } catch (err) { console.error('加载关于页配置失败:', err) }
      finally { this.loading = false }
    },

    openPicker(target) { this.pickTarget = target; this.showPicker = true },

    onAssetPicked(asset) {
      const url = asset.public_url
      const map = { banner: 'banner_image', avatar: 'sidebar_avatar', bottom: 'sidebar_bottom_img', pagebg: 'page_bg_image', backtop: 'backtop_icon' }
      const key = map[this.pickTarget]
      if (key) this.form[key] = url
      this.showPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        const configs = Object.entries(this.form).map(([k, v]) => ({
          section: 'about', key: k, value: v,
        }))
        await batchUpsertConfigs(configs)
        pageConfigStore.invalidateSection('about')
        this.$message.success('关于页配置已保存')
      } catch (err) { this.$message.error('保存失败: ' + err.message) }
      finally { this.saving = false }
    },
  },
}
</script>
