<!--
  页面编辑器总览页
  提供到各子编辑器的导航入口
-->
<template>
  <div class="page-editor-overview">
    <h3 style="margin-bottom: 20px;">🎨 页面编辑器</h3>
    <p style="color: #909399; margin-bottom: 24px;">选择一个编辑模块，对主页面的各个元素进行可视化修改。</p>

    <el-row :gutter="16">
      <el-col :span="8" v-for="item in editors" :key="item.path">
        <el-card
          shadow="hover"
          class="editor-entry-card"
          @click.native="$router.push(item.path)"
        >
          <div class="entry-icon">{{ item.icon }}</div>
          <div class="entry-title">{{ item.title }}</div>
          <div class="entry-desc">{{ item.desc }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'PageEditorView',
  data() {
    return {
      editors: [
        { icon: '🌄', title: '动态背景', desc: '图片/视频/粒子/渐变背景设置', path: '/admin/editor/bg' },
        { icon: '🖱️', title: '鼠标指针', desc: '自定义光标/拖尾/发光特效', path: '/admin/editor/cursor' },
        { icon: '🎵', title: '背景音乐', desc: '播放列表管理', path: '/admin/editor/music' },
        { icon: '🏠', title: 'Banner 导航', desc: '导航栏/友链/Banner图设置', path: '/admin/editor/banner' },
        { icon: '📝', title: '首页内容', desc: '头像/打字机文本/社交链接', path: '/admin/editor/content' },
      ],
    }
  },
}
</script>

<style lang="scss" scoped>
.editor-entry-card {
  cursor: pointer;
  text-align: center;
  padding: 12px;
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
}

.entry-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.entry-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.entry-desc {
  font-size: 13px;
  color: #909399;
}
</style>
