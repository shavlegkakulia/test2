"use strict";

const path = require('path');
const webpack = require('webpack');
const bundleOutputDir = './dist';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

function envKeys(env, argv) {
    if (!env) env = 'dev';
    let config = require('./' + env + '.js');
    
    for (let prop in argv) {
        if (config[prop] === undefined) continue;
        config[prop] = argv[prop];
    }
    return config;
}

function getPlugins(config, isProd, analyze) {
    var plugins = [
        new webpack.DefinePlugin({
            'globalConfig': JSON.stringify(config)
        }),
        new HtmlWebpackPlugin({
            template: './index.html',
            baseUrl: config.base_URL,
            webURL: config.web_URL,
            hash: false,
            minify: false
        }),
        new CopyWebpackPlugin([
            { from: './assets/', to: './assets/', force: true }
        ])
    ];
    if (analyze) plugins.push(new BundleAnalyzerPlugin());

    if (isProd) {
        plugins.push(
            new CleanWebpackPlugin(),
            new MiniCssExtractPlugin({
                filename: isProd ? '[name].[hash].css' : '[name].css',
                chunkFilename: isProd ? '[name].[hash].css' : '[name].css',
            })
        );
    }

    return plugins;
}

module.exports = (env, argv) => {
    let isProd = argv.mode === 'production';
    let analyze = (argv.analyze === 'true');
    let config = envKeys(env, argv);

    return {
        entry: { 'app': './app/app.js' },
        output: {
            path: path.join(__dirname, bundleOutputDir),
            filename: isProd ? '[name].[contenthash].js' : '[name].js',
            publicPath: config.base_URL
        },
        devServer: {
            contentBase: path.join(__dirname, bundleOutputDir),
            historyApiFallback:  {
                disableDotRule: true
            },
            port: 9000
        },
        devtool: !isProd && 'source-map',
        plugins: getPlugins(config, isProd, analyze),
        optimization: {
            splitChunks: {
                // include all types of chunks
                chunks: 'all'
            },
            minimizer: [
                new TerserPlugin(),
                new OptimizeCSSAssetsPlugin({})
            ]
        },
        module: {
            rules: [
                {
                    test: /\.css|scss$/,
                    use: [
                        isProd ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'sass-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [require('autoprefixer')()],
                            }
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|gif|woff|woff2|eot|ttf|svg)$/,
                    use: [
                        { loader: 'file-loader' }
                    ]
                },
                {
                    test: /\.jsx?$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ["@babel/preset-env", "@babel/preset-react"],
                            plugins: ['react-hot-loader/babel',
                                '@babel/plugin-syntax-dynamic-import',
                                '@babel/plugin-transform-runtime',
                                '@babel/plugin-proposal-object-rest-spread',
                                '@babel/plugin-proposal-class-properties',
                                '@babel/plugin-proposal-nullish-coalescing-operator',
                                '@babel/plugin-proposal-optional-chaining']
                        }
                    }
                }
            ]
        }
    };
};