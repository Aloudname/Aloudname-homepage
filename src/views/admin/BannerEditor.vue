<!--
  Banner 和导航编辑器
-->
<template>
  <div class="editor-page" v-loading="loading">
    <h3>🏠 Banner & 导航编辑</h3>

    <!-- 网站标题 -->
    <div class="editor-panel">
      <div class="panel-title">网站标题 (TopBar)</div>
      <el-input v-model="siteTitle" placeholder="如: chaichai.top" />
    </div>

    <!-- Banner 背景图 -->
    <div class="editor-panel">
      <div class="panel-title">
        Banner 背景图片
        <el-button size="small" type="primary" @click="addBannerImage" style="float:right;">+ 添加</el-button>
      </div>
      <el-table :data="bannerImages" style="width:100%">
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="图片 URL" prop="url">
          <template slot-scope="scope">
            <el-input v-model="scope.row" placeholder="输入图片 URL" size="small">
              <el-button slot="append" size="mini" @click="pickBannerImage(scope.$index)">选择</el-button>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeBannerImage(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 导航菜单 -->
    <div class="editor-panel">
      <div class="panel-title">
        导航菜单项
        <el-button size="small" type="primary" @click="addNavItem" style="float:right;">+ 添加</el-button>
      </div>
      <el-table :data="navItems" style="width:100%">
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="显示名称" prop="label">
          <template slot-scope="scope">
            <el-input v-model="scope.row.label" placeholder="如: 首页" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="路由路径" prop="path">
          <template slot-scope="scope">
            <el-input v-model="scope.row.path" placeholder="如: /about" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeNavItem(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 友链 -->
    <div class="editor-panel">
      <div class="panel-title">
        友情链接
        <el-button size="small" type="primary" @click="addFriendLink" style="float:right;">+ 添加</el-button>
      </div>
      <el-table :data="friendLinks" style="width:100%">
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="名称" prop="name">
          <template slot-scope="scope">
            <el-input v-model="scope.row.name" placeholder="友链名称" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="链接" prop="url">
          <template slot-scope="scope">
            <el-input v-model="scope.row.url" placeholder="https://..." size="small" />
          </template>
        </el-table-column>
        <el-table-column label="图标" prop="icon" width="200">
          <template slot-scope="scope">
            <el-input v-model="scope.row.icon" placeholder="图标 URL（可选）" size="small">
              <el-button slot="append" size="mini" @click="pickFriendIcon(scope.$index)">选择</el-button>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeFriendLink(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 保存 -->
    <div class="editor-panel" style="text-align:right;">
      <el-button @click="loadConfig">重置</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">💾 保存配置</el-button>
    </div>

    <!-- 资源选择 -->
    <el-dialog title="选择资源" :visible.sync="showAssetPicker" width="700px" :append-to-body="true">
      <AssetPicker category="image" @select="onAssetSelected" />
    </el-dialog>
  </div>
</template>

<script>
import { getSectionConfig, batchUpsertConfigs } from '@/services/pageConfigService'
import pageConfigStore from '@/stores/pageConfig'

export default {
  name: 'BannerEditor',

  data() {
    return {
      loading: false,
      saving: false,
      siteTitle: 'chaichai.top',
      bannerImages: [],
      navItems: [],
      friendLinks: [],
      showAssetPicker: false,
      pickMode: '',    // 'banner' | 'icon'
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
        const config = await getSectionConfig('banner')
        if (config.images) this.bannerImages = config.images
        if (config.title) this.siteTitle = config.title
        if (config.nav_items) this.navItems = config.nav_items
        if (config.friend_links) this.friendLinks = config.friend_links
      } catch (err) {
        console.error('加载 Banner 配置失败:', err)
      } finally {
        this.loading = false
      }
    },

    addBannerImage() { this.bannerImages.push('') },
    removeBannerImage(i) { this.bannerImages.splice(i, 1) },
    pickBannerImage(i) { this.pickMode = 'banner'; this.pickIndex = i; this.showAssetPicker = true },

    addNavItem() { this.navItems.push({ label: '', path: '' }) },
    removeNavItem(i) { this.navItems.splice(i, 1) },

    addFriendLink() { this.friendLinks.push({ name: '', url: '', icon: '' }) },
    removeFriendLink(i) { this.friendLinks.splice(i, 1) },
    pickFriendIcon(i) { this.pickMode = 'icon'; this.pickIndex = i; this.showAssetPicker = true },

    onAssetSelected(asset) {
      if (this.pickMode === 'banner') {
        this.$set(this.bannerImages, this.pickIndex, asset.public_url)
      } else if (this.pickMode === 'icon') {
        this.$set(this.friendLinks[this.pickIndex], 'icon', asset.public_url)
      }
      this.showAssetPicker = false
    },

    async saveConfig() {
      this.saving = true
      try {
        await batchUpsertConfigs([
          { section: 'banner', key: 'title', value: this.siteTitle },
          { section: 'banner', key: 'images', value: this.bannerImages.filter(Boolean) },
          { section: 'banner', key: 'nav_items', value: this.navItems.filter(item => item.label && item.path) },
          { section: 'banner', key: 'friend_links', value: this.friendLinks.filter(item => item.name && item.url) },
        ])
        pageConfigStore.invalidateSection('banner')
        this.$message.success('Banner 配置已保存')
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
