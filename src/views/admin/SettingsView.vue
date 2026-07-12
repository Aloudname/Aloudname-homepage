<!--
  全局设置页
-->
<template>
  <div class="editor-page" v-loading="loading">
    <h3>⚙️ 全局设置</h3>

    <div class="editor-panel">
      <div class="panel-title">网站信息</div>
      <el-form label-position="left" label-width="120px">
        <el-form-item label="网站标题">
          <el-input v-model="settings.site_title" placeholder="将显示在浏览器标签页" />
        </el-form-item>
        <el-form-item label="SEO 描述">
          <el-input v-model="settings.seo_description" type="textarea" :rows="2" placeholder="搜索引擎显示的描述文字" />
        </el-form-item>
        <el-form-item label="SEO 关键词">
          <el-input v-model="settings.seo_keywords" placeholder="逗号分隔，如: blog,个人博客,二次元" />
        </el-form-item>
        <el-form-item label="Favicon URL">
          <el-input v-model="settings.favicon_url" placeholder="浏览器标签页图标 URL" />
        </el-form-item>
      </el-form>
    </div>

    <div class="editor-panel">
      <div class="panel-title">页脚信息</div>
      <el-form label-position="left" label-width="120px">
        <el-form-item label="ICP 备案号">
          <el-input v-model="settings.icp_number" placeholder="如: 滇ICP备2022000365号" />
        </el-form-item>
        <el-form-item label="版权文字">
          <el-input v-model="settings.copyright_text" placeholder="© 2024 YourName 版权所有" />
        </el-form-item>
        <el-form-item label="网站起始日">
          <el-date-picker
            v-model="settings.site_start_date"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="底部信息">
          <el-input v-model="settings.footer_text" type="textarea" :rows="2" placeholder="额外的页脚信息" />
        </el-form-item>
      </el-form>
    </div>

    <div class="editor-panel" style="text-align:right;">
      <el-button @click="loadSettings">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveSettings">💾 保存设置</el-button>
    </div>
  </div>
</template>

<script>
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'

export default {
  name: 'SettingsView',

  data() {
    return {
      loading: false,
      saving: false,
      settings: {
        site_title: '',
        seo_description: '',
        seo_keywords: '',
        favicon_url: '',
        icp_number: '',
        copyright_text: '',
        site_start_date: '',
        footer_text: '',
      },
    }
  },

  async created() {
    await this.loadSettings()
  },

  methods: {
    async loadSettings() {
      this.loading = true
      try {
        const [globalCfg, footerCfg] = await Promise.all([
          getSectionConfig('global'),
          getSectionConfig('footer'),
        ])
        this.settings.site_title = globalCfg?.site_title || ''
        this.settings.seo_description = globalCfg?.seo_description || ''
        this.settings.seo_keywords = (globalCfg?.seo_keywords || []).join(', ')
        this.settings.favicon_url = globalCfg?.favicon_url || ''
        this.settings.icp_number = footerCfg?.icp_number || ''
        this.settings.copyright_text = footerCfg?.copyright_text || ''
        this.settings.site_start_date = footerCfg?.start_date || ''
        this.settings.footer_text = footerCfg?.footer_text || ''
      } catch (err) {
        console.error('加载设置失败:', err)
      } finally {
        this.loading = false
      }
    },

    async saveSettings() {
      this.saving = true
      try {
        const configs = [
          { section: 'global', key: 'site_title', value: this.settings.site_title },
          { section: 'global', key: 'seo_description', value: this.settings.seo_description },
          { section: 'global', key: 'seo_keywords', value: this.settings.seo_keywords.split(',').map(s => s.trim()).filter(Boolean) },
          { section: 'global', key: 'favicon_url', value: this.settings.favicon_url },
          { section: 'footer', key: 'icp_number', value: this.settings.icp_number },
          { section: 'footer', key: 'copyright_text', value: this.settings.copyright_text },
          { section: 'footer', key: 'start_date', value: this.settings.site_start_date },
          { section: 'footer', key: 'footer_text', value: this.settings.footer_text },
        ]
        await batchUpsertConfigs(configs)
        pageConfigStore.invalidate()
        this.$message.success('全局设置已保存')
      } catch (err) {
        this.$message.error('保存失败: ' + err.message)
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
