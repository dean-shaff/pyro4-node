exports.VERSION = "3.0.0"

const { config } = require("./lib/configuration.js")
const { Proxy, SocketProxy, WebSocketProxy, ProxyBase } = require("./lib/proxy/proxy.js")
const { DaemonBase, SocketDaemon, WebSocketDaemon, expose } = require('./lib/daemon/daemon.js')
const { NameServerDaemon, startNs } = require("./lib/naming.js")
const { URI } = require("./lib/uri.js")

exports.config = config
exports.Proxy = Proxy
exports.SocketDaemon = SocketDaemon
exports.WebSocketDaemon = WebSocketDaemon
exports.DaemonBase = DaemonBase
exports.SocketDaemon = SocketDaemon
exports.WebSocketDaemon = WebSocketDaemon
exports.expose = expose
exports.NameServerDaemon = NameServerDaemon
exports.startNs = startNs
exports.URI = URI
