<template>
  <div class="editor-page" v-loading="loading">
    <h3>📖 关于页编辑</h3>

    <!-- Banner 配置 -->
    <div class="editor-panel">
      <div class="panel-title">Banner 设置</div>
      <el-form label-position="left" label-width="100px">
        <el-form-item label="背景图片">
          <el-input v-model="form.banner_image" placeholder="Banner 背景图 URL">
            <el-button slot="append" @click="openPicker('image')">选择资源</el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="标题文字">
          <el-input v-model="form.banner_title" placeholder="如: 关于我" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 侧边栏配置 -->
    <div class="editor-panel">
      <div class="panel-title">侧边栏设置</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="头像 URL">
            <el-input v-model="form.sidebar_avatar" placeholder="头像图片 URL">
              <el-button slot="append" @click="openPicker('avatar')">选择</el-button>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <div class="preview-inline" v-if="form.sidebar_avatar">
            <el-avatar :src="form.sidebar_avatar" :size="60" />
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16" style="margin-top:12px;">
        <el-col :span="12">
          <el-form-item label="昵称">
            <el-input v-model="form.sidebar_name" placeholder="侧边栏昵称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="简介">
            <el-input v-model="form.sidebar_bio" placeholder="一句话简介" />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- Markdown 内容 -->
    <div class="editor-panel">
      <div class="panel-title">页面内容（Markdown）</div>
      <el-input
        v-model="form.markdown_content"
        type="textarea"
        :rows="16"
        placeholder="支持 Markdown 语法..."
        style="font-family:monospace;font-size:14px;"
      />
    </div>

    <!-- 预览 -->
    <div class="editor-panel">
      <div class="panel-title">
        内容预览
        <el-button size="mini" type="text" @click="showPreview = !showPreview">
          {{ showPreview ? '隐藏' : '显示' }}预览
        </el-button>
      </div>
      <div v-if="showPreview" class="markdown-body"
           style="padding:16px;background:#fafafa;border-radius:8px;text-align:left;min-height:100px;">
        <VueMarkdown v-if="form.markdown_content" :source="form.markdown_content" />
        <span v-else style="color:#c0c4cc;">输入 Markdown 内容后点击"显示预览"</span>
      </div>
    </div>

    <!-- 保存 -->
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
      loading: false,
      saving: false,
      showPreview: false,
      showPicker: false,
      pickTarget: 'image',
      form: {
        banner_image: '',
        banner_title: '',
        sidebar_avatar: '',
        sidebar_name: '',
        sidebar_bio: '',
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
        if (cfg.banner_image) this.form.banner_image = cfg.banner_image
        if (cfg.banner_title) this.form.banner_title = cfg.banner_title
        if (cfg.sidebar_avatar) this.form.sidebar_avatar = cfg.sidebar_avatar
        if (cfg.sidebar_name) this.form.sidebar_name = cfg.sidebar_name
        if (cfg.sidebar_bio) this.form.sidebar_bio = cfg.sidebar_bio
        if (cfg.markdown_content) this.form.markdown_content = cfg.markdown_content
      } catch (err) {
        console.error('加载关于页配置失败:', err)
      } finally {
        this.loading = false
      }
    },

    openPicker(target) {
      this.pickTarget = target
      this.showPicker = true
    },

    onAssetPicked(asset) {
      const url = asset.public_url
      if (this.pickTarget === 'image') this.form.banner_image = url
      else if (this.pickTarget === 'avatar') this.form.sidebar_avatar = url
      this.showPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        await batchUpsertConfigs([
          { section: 'about', key: 'banner_image', value: this.form.banner_image },
          { section: 'about', key: 'banner_title', value: this.form.banner_title },
          { section: 'about', key: 'sidebar_avatar', value: this.form.sidebar_avatar },
          { section: 'about', key: 'sidebar_name', value: this.form.sidebar_name },
          { section: 'about', key: 'sidebar_bio', value: this.form.sidebar_bio },
          { section: 'about', key: 'markdown_content', value: this.form.markdown_content },
        ])
        pageConfigStore.invalidateSection('about')
        this.$message.success('关于页配置已保存')
      } catch (err) {
        this.$message.error('保存失败: ' + err.message)
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.preview-inline {
  display: flex;
  align-items: center;
  height: 40px;
}
</style>
