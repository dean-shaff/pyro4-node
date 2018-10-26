// for use with webpack v4
const path = require("path")

module.exports = {
    target: "web",
    mode: 'development',
    entry: [
        "./index.front.js"
    ],
    output: {
        filename: "index.js",
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
}
