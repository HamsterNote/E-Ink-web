const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'development',
  entry: {
    bundle: path.resolve(__dirname, 'src/index.ts'),
    reader: path.resolve(__dirname, 'src/reader/index.ts')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    // 将打包结果包裹为 IIFE，避免旧版 WebKit 对于顶层 this/模块语义的兼容性问题
    iife: true,
    // 旧版 WebKit/Safari 的全局对象行为怪异，使用 'this' 更稳妥
    globalObject: 'this',
    environment: {
      arrowFunction: false,
      const: false,
      destructuring: false,
      forOf: false,
      module: false
    }
  },
  target: ['web', 'es5'],
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          // IMPORTANT: Loaders run from right to left. We want TypeScript -> JS first,
          // then let Babel process the JS for target environments. So place
          // 'ts-loader' on the RIGHT and 'babel-loader' on the LEFT.
          {
            loader: 'babel-loader'
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist')
        }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'public')
    },
    host: '0.0.0.0',
    port: 5973,
    open: false,
    hot: false,
    compress: false,
    client: {
      overlay: false
    },
    // 开发环境代理：将所有以 /api 开头的请求转发到本地后端服务
    // 例如：/api/v1/auth/send-email-code -> http://localhost:3000/api/v1/auth/send-email-code
    // 如果你的后端并不需要 /api 前缀，可以取消注释 pathRewrite 去掉前缀
    proxy: [{
        context: ['/api'],
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // 保留 /api 前缀。如果后端没有 /api 前缀，请取消注释下一行：
        // pathRewrite: { '^/api': '' },
    }]
  }
};
