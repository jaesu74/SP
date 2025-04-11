const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      main: './src/js/core/app.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash:8].js',
      chunkFilename: 'js/[name].[contenthash:8].chunk.js',
      assetModuleFilename: 'assets/[name].[hash:8][ext]',
      publicPath: './',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
    },
    module: {
      rules: [
        // JavaScript 처리
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  useBuiltIns: 'usage',
                  corejs: 3,
                  targets: '> 0.25%, not dead',
                }],
              ],
              plugins: [
                '@babel/plugin-transform-runtime',
                '@babel/plugin-proposal-class-properties',
              ],
            },
          },
        },
        // CSS 처리
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    'autoprefixer',
                    'postcss-preset-env',
                  ],
                },
              },
            },
          ],
        },
        // 이미지 처리
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb 이하는 인라인 처리
            },
          },
        },
        // 폰트 처리
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/js/components'),
        '@services': path.resolve(__dirname, 'src/js/services'),
        '@utils': path.resolve(__dirname, 'src/js/utils'),
        '@core': path.resolve(__dirname, 'src/js/core'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        inject: 'body',
        scriptLoading: 'defer',
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[name].[contenthash:8].chunk.css',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'src/data', to: 'data' },
          { from: 'src/assets', to: 'assets' },
          { from: 'CNAME', to: '', noErrorOnMissing: true },
          { from: '.nojekyll', to: '', noErrorOnMissing: true },
        ],
      }),
    ],
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 512000, // 500kb
      maxEntrypointSize: 512000,
    },
  };
};