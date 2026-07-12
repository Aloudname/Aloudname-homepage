module.exports = {
  // GitHub Pages 项目站点路径。换成自定义域名后改回 '/'
  publicPath: '/Aloudname-homepage/',
  outputDir: 'dist',

  chainWebpack: config => {
    // 使用 webpack 5 内置 asset/source 类型加载 .md 文件为纯文本
    // 替代有兼容性问题的 vue-markdown-loader
    config.module.rule('md')
      .test(/\.md$/)
      .type('asset/source')
  },

  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/admin/, to: '/index.html' },
        { from: /./, to: '/index.html' }
      ]
    }
  },

  // 生产环境关闭 source map 减小体积
  productionSourceMap: false,
}
