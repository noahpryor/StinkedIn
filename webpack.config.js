module.exports = {
    entry: './src/content-script.js',
    output: {
        path: __dirname + "/dist",
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader'
            }
        ]
    },
    devtool: 'source-map'
};
