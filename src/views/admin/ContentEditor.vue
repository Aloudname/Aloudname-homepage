<!--
  首页内容编辑器
  头像/作者名/打字机文本/社交链接
-->
<template>
  <div class="editor-page" v-loading="loading">
    <h3>📝 首页内容编辑</h3>

    <!-- 头像 -->
    <div class="editor-panel">
      <div class="panel-title">头像</div>
      <el-input v-model="avatarUrl" placeholder="输入头像 URL">
        <el-button slot="append" @click="showAssetPicker = true">选择资源</el-button>
      </el-input>
      <div v-if="avatarUrl" style="margin-top:12px;">
        <el-avatar :src="avatarUrl" :size="80" />
      </div>
    </div>

    <!-- 作者名 -->
    <div class="editor-panel">
      <div class="panel-title">作者名称</div>
      <el-input v-model="authorName" placeholder="如: 柴柴" />
    </div>

    <!-- 打字机文本 -->
    <div class="editor-panel">
      <div class="panel-title">
        打字机文本（首页轮播的文字）
        <el-button size="small" type="primary" @click="addText" style="float:right;">+ 添加</el-button>
      </div>
      <el-table :data="typewriterTexts" style="width:100%">
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="文本内容">
          <template slot-scope="scope">
            <el-input
              v-model="typewriterTexts[scope.$index]"
              placeholder="输入一段欢迎文字..."
              size="small"
              type="textarea"
              :rows="2"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="mini"
              @click="removeText(scope.$index)"
              :disabled="typewriterTexts.length <= 1"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 社交链接 -->
    <div class="editor-panel">
      <div class="panel-title">
        社交链接
        <el-button size="small" type="primary" @click="addSocial" style="float:right;">+ 添加</el-button>
      </div>
      <el-table :data="socialLinks" style="width:100%">
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="平台名称" prop="platform">
          <template slot-scope="scope">
            <el-input v-model="scope.row.platform" placeholder="如: QQ, GitHub" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="动作类型" prop="action" width="120">
          <template slot-scope="scope">
            <el-select v-model="scope.row.action" size="small">
              <el-option label="弹窗 display" value="dialog" />
              <el-option label="跳转外链" value="link" />
              <el-option label="复制内容" value="copy" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="值/链接" prop="value">
          <template slot-scope="scope">
            <el-input v-model="scope.row.value" placeholder="QQ号 或 URL" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeSocial(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 保存 -->
    <div class="editor-panel" style="text-align:right;">
      <el-button @click="loadConfig">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">💾 保存配置</el-button>
    </div>

    <!-- 资源选择器 -->
    <el-dialog title="选择头像图片" :visible.sync="showAssetPicker" width="700px" :append-to-body="true">
      <AssetPicker category="image" @select="onAssetSelected" />
    </el-dialog>
  </div>
</template>

<script>
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'

export default {
  name: 'ContentEditor',

  data() {
    return {
      loading: false,
      saving: false,
      avatarUrl: '',
      authorName: '',
      typewriterTexts: [''],
      socialLinks: [
        { platform: 'QQ', action: 'dialog', value: '' },
        { platform: 'GitHub', action: 'link', value: '' },
      ],
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
        const config = await getSectionConfig('home')
        if (config.avatar_url) this.avatarUrl = config.avatar_url
        if (config.author_name) this.authorName = config.author_name
        if (config.typewriter_texts) this.typewriterTexts = config.typewriter_texts
        if (config.social_links) this.socialLinks = config.social_links
      } catch (err) {
        console.error('加载首页配置失败:', err)
      } finally {
        this.loading = false
      }
    },

    addText() { this.typewriterTexts.push('') },
    removeText(i) { if (this.typewriterTexts.length > 1) this.typewriterTexts.splice(i, 1) },

    addSocial() { this.socialLinks.push({ platform: '', action: 'dialog', value: '' }) },
    removeSocial(i) { this.socialLinks.splice(i, 1) },

    onAssetSelected(asset) {
      this.avatarUrl = asset.public_url
      this.showAssetPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        await batchUpsertConfigs([
          { section: 'home', key: 'avatar_url', value: this.avatarUrl },
          { section: 'home', key: 'author_name', value: this.authorName },
          { section: 'home', key: 'typewriter_texts', value: this.typewriterTexts.filter(Boolean) },
          { section: 'home', key: 'social_links', value: this.socialLinks.filter(s => s.platform) },
        ])
        pageConfigStore.invalidateSection('home')
        this.$message.success('首页内容已保存')
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
