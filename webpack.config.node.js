// for use with webpack v4
const path = require("path")

module.exports = {
    target: 'node',
    mode: 'production',
    entry: [
        "./index.node.js"
    ],
    output: {
        filename: "index.node.js",
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, "src"),
                loader: "babel-loader"
            },
        ]
    },
    watchOptions: {
        ignored: /node_modules/
    }
    // node: {
    //     console: false,
    //     global: true,
    //     process: true,
    //     __filename: 'mock',
    //     __dirname: 'mock',
    //     Buffer: true,
    //     setImmediate: true
    //     // See "Other node core libraries" for additional options.
    // },
    // externals: nodeModules
}
