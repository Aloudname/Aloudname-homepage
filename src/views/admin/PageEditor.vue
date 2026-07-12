<template>
  <div v-loading="pageLoading">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3>{{ isNew ? '新建页面' : '编辑页面' }}</h3>
      <div>
        <el-button @click="$router.push('/admin/pages')">返回列表</el-button>
        <el-button :loading="saving" @click="save(false)">存草稿</el-button>
        <el-button type="primary" :loading="publishing" @click="save(true)">发布</el-button>
      </div>
    </div>

    <div class="editor-panel">
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="页面标题">
              <el-input v-model="form.title" placeholder="页面标题" size="large" @input="autoSlug" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="URL 路径">
              <el-input v-model="form.slug" placeholder="url-path">
                <template slot="prepend">/</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="内容（Markdown 格式）">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="18"
            placeholder="支持 Markdown 语法编写页面内容..."
            style="font-family:monospace;font-size:14px;"
          />
        </el-form-item>

        <el-form-item label="排序权重（越小越靠前）">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" size="small" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 预览 -->
    <div class="editor-panel">
      <div class="panel-title">内容预览</div>
      <div class="markdown-body" style="text-align:left;padding:16px;background:#fafafa;border-radius:8px;min-height:100px;">
        <VueMarkdown v-if="form.content" :source="form.content" />
        <span v-else style="color:#c0c4cc;">在左侧输入 Markdown 内容即可预览</span>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from 'vue-markdown'
import { getPageBySlug, savePage, generateSlug, getAllPages } from '@/services/pagesService'

export default {
  name: 'PageEditor',
  components: { VueMarkdown },

  data() {
    return {
      pageLoading: false,
      saving: false,
      publishing: false,
      form: {
        title: '',
        slug: '',
        content: '## 新页面\n\n在这里编写内容...',
        is_published: false,
        sort_order: 0,
      },
    }
  },

  computed: {
    isNew() { return !this.$route.params.id },
  },

  async created() {
    if (!this.isNew) {
      this.pageLoading = true
      try {
        const pages = await getAllPages()
        const p = pages.find(x => x.id === this.$route.params.id)
        if (p) { this.form = { ...p } }
        else { this.$message.error('页面不存在'); this.$router.push('/admin/pages') }
      } catch (err) { this.$message.error('加载失败') }
      finally { this.pageLoading = false }
    }
  },

  methods: {
    autoSlug() {
      if (this.isNew || !this.form.slug) {
        this.form.slug = generateSlug(this.form.title)
      }
    },

    async save(publish) {
      if (!this.form.title.trim()) return this.$message.warning('请输入标题')
      const key = publish ? 'publishing' : 'saving'
      this[key] = true
      try {
        const data = {
          ...this.form,
          slug: this.form.slug || generateSlug(this.form.title),
          is_published: publish,
        }
        if (!this.isNew) data.id = this.$route.params.id
        await savePage(data)
        this.$message.success(publish ? '页面已发布' : '草稿已保存')
        this.$router.push('/admin/pages')
      } catch (err) { this.$message.error(err.message) }
      finally { this[key] = false }
    },
  },
}
</script>
