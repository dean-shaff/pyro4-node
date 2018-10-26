exports.VERSION = "3.0.0"

const { config } = require("./lib/configuration.js")
const { Proxy } = require("./lib/proxy.js")
const { WebSocketProxy } = require("./lib/web-socket-proxy.js")
const { SocketProxy } = require("./lib/socket-proxy.js")
const { Daemon, expose } = require('./lib/daemon.js')
const { SocketDaemon } = require('./lib/socket-daemon.js')
const { WebSocketDaemon } = require('./lib/web-socket-daemon.js')
const { NameServerDaemon, startNs } = require("./lib/naming.js")
const { URI } = require("./lib/uri.js")

exports.config = config
exports.Proxy = Proxy
exports.SocketDaemon = SocketDaemon
exports.WebSocketDaemon = WebSocketDaemon
exports.Daemon = Daemon
exports.expose = expose
exports.NameServerDaemon = NameServerDaemon
exports.startNs = startNs
exports.URI = URI
