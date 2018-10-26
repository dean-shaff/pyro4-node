exports.VERSION = "3.0.0"

const { Buffer }  = require("buffer/")
const { WebSocketProxy } = require("./lib/web-socket-proxy.js")
window.WebSocketProxy = WebSocketProxy
