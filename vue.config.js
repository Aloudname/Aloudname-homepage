module.exports = {
  // 自定义域名部署使用根路径
  publicPath: '/',
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
