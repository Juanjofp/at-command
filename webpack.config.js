/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const ShebangPlugin = require('webpack-shebang-plugin');

module.exports = {
    entry: { index: './src/index.ts', cli: './src/cli.ts' },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig-build.json'
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new ShebangPlugin({
            header: '#!/usr/bin/env node',
            entry: 'cli'
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })]
        // alias: {
        //     '@': path.resolve(__dirname, 'src'),
        //     'src': path.resolve(__dirname, 'src'),
        // },
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        libraryTarget: 'commonjs2'
    },
    mode: 'production',
    target: 'node',
    externals: [nodeExternals()]
};
