const path = require('path');

module.exports = {
    entry: './source.js',
    mode: 'production',
    output: {
        filename: 'content.js',
        path: path.resolve(__dirname, '')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
};
