<!--
  文章编辑器（新建/编辑）
  使用 Element Tiptap 富文本编辑器
-->
<template>
  <div v-loading="pageLoading">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3>{{ isNew ? '新建文章' : '编辑文章' }}</h3>
      <div>
        <el-button @click="$router.push('/admin/posts')">返回列表</el-button>
        <el-button :loading="saving" @click="saveDraft">存为草稿</el-button>
        <el-button type="primary" :loading="publishing" @click="publish">发布文章</el-button>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="editor-panel">
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="文章标题">
              <el-input
                v-model="form.title"
                placeholder="请输入文章标题"
                size="large"
                @input="autoGenerateSlug"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="URL Slug">
              <el-input v-model="form.slug" placeholder="url-friendly-slug" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="分类">
              <el-input v-model="form.category" placeholder="如: 技术/生活/随笔" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标签（逗号分隔）">
              <el-input
                v-model="tagsInput"
                placeholder="如: Vue,JavaScript,前端"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="封面图">
              <el-input v-model="form.cover_url" placeholder="封面图 URL">
                <el-button slot="append" @click="showAssetPicker = true">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="摘要（可选，留空则自动截取正文前200字）">
          <el-input
            v-model="form.excerpt"
            type="textarea"
            :rows="2"
            placeholder="文章摘要..."
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- 正文编辑器 -->
    <div class="editor-panel">
      <div class="panel-title">文章内容</div>
      <el-tiptap
        @onInit="onEditorInit"
        v-model="form.content"
        :extensions="extensions"
        lang="zh"
        class="post-editor-tiptap"
        style="min-height:400px;"
      />
    </div>

    <!-- 资源选择器 -->
    <el-dialog title="选择封面图" :visible.sync="showAssetPicker" width="700px" :append-to-body="true">
      <AssetPicker category="image" @select="onAssetSelected" />
    </el-dialog>
  </div>
</template>

<script>
import {
  ElementTiptap,
  Doc, Text, Paragraph, Heading, Bold, Italic, Strike,
  ListItem, BulletList, OrderedList, Link, Image,
  CodeBlock, Blockquote, TodoItem, TodoList,
  TextAlign, FontSize, FontType, Fullscreen,
  TextHighlight, TextColor, FormatClear,
  Table, TableHeader, TableCell, TableRow,
  History, TrailingNode, HardBreak, HorizontalRule,
  LineHeight, Indent,
} from 'element-tiptap'
import { getPostBySlug, savePost, generateSlug } from '@/services/postsService'
import { getAllPosts } from '@/services/postsService'

export default {
  name: 'PostEditView',

  data() {
    return {
      pageLoading: false,
      saving: false,
      publishing: false,
      form: {
        title: '',
        slug: '',
        content: '<h1>请输入文章内容</h1>',
        excerpt: '',
        cover_url: '',
        tags: [],
        category: '',
        is_published: false,
        is_top: false,
      },
      tagsInput: '',
      showAssetPicker: false,
      extensions: [
        new Doc(), new Text(), new Paragraph(),
        new Heading({ level: 6 }),
        new Bold({ bubble: true }),
        new Italic({ bubble: true }),
        new Strike({ bubble: true }),
        new ListItem(), new BulletList({ bubble: true }),
        new OrderedList({ bubble: true }),
        new Link(), new Image(),
        new CodeBlock({ bubble: true }),
        new Blockquote(),
        new TodoItem(), new TodoList(),
        new TextAlign({ bubble: true }),
        new FontSize({ bubble: true }),
        new FontType({ bubble: true }),
        new Fullscreen(),
        new TextHighlight({ bubble: true }),
        new TextColor({ bubble: true }),
        new FormatClear({ bubble: true }),
        new Table({ resizable: true }),
        new TableHeader(), new TableCell(), new TableRow(),
        new History(), new TrailingNode(),
        new HardBreak(), new HorizontalRule(),
        new LineHeight(), new Indent(),
      ],
    }
  },

  computed: {
    isNew() {
      return !this.$route.params.id
    },
  },

  async created() {
    if (!this.isNew) {
      await this.loadPost()
    }
  },

  methods: {
    async loadPost() {
      this.pageLoading = true
      try {
        // 先尝试作为 ID 获取所有文章中找到对应的
        const posts = await getAllPosts()
        const post = posts.find(p => p.id === this.$route.params.id)
        if (post) {
          this.form = {
            ...post,
            content: post.content || '<h1></h1>',
            excerpt: post.excerpt || '',
            cover_url: post.cover_url || '',
            category: post.category || '',
          }
          this.tagsInput = (post.tags || []).join(', ')
        } else {
          this.$message.error('文章不存在')
          this.$router.push('/admin/posts')
        }
      } catch (err) {
        console.error('加载文章失败:', err)
        this.$message.error('加载文章失败')
      } finally {
        this.pageLoading = false
      }
    },

    autoGenerateSlug() {
      if (this.isNew || !this.form.slug) {
        this.form.slug = generateSlug(this.form.title)
      }
    },

    onEditorInit({ editor }) {
      // editor 实例可用于高级操作
    },

    onAssetSelected(asset) {
      this.form.cover_url = asset.public_url
      this.showAssetPicker = false
    },

    async saveDraft() {
      this.saving = true
      try {
        await this.doSave(false)
      } finally {
        this.saving = false
      }
    },

    async publish() {
      if (!this.form.title.trim()) {
        this.$message.warning('请输入文章标题')
        return
      }
      this.publishing = true
      try {
        await this.doSave(true)
      } finally {
        this.publishing = false
      }
    },

    async doSave(publish) {
      const post = {
        ...this.form,
        tags: this.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        is_published: publish,
        slug: this.form.slug || generateSlug(this.form.title),
        excerpt: this.form.excerpt || this.getExcerpt(this.form.content),
      }

      if (!this.isNew) {
        post.id = this.$route.params.id
      }

      await savePost(post)
      this.$message.success(publish ? '文章已发布' : '草稿已保存')
      this.$router.push('/admin/posts')
    },

    getExcerpt(content) {
      // 去除 HTML 标签，截取前 200 字符
      const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      return text.length > 200 ? text.substring(0, 200) + '...' : text
    },
  },

  components: {
    AssetPicker: () => import('./components/AssetPicker.vue'),
  },
}
</script>

<style lang="scss">
.post-editor-tiptap {
  text-align: left;
}
</style>
