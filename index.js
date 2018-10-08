const { config } = require("./lib/configuration.js")
config.logLevel.Message = "error"
config.logLevel.Proxy = "error"
config.logLevel.Daemon = "error"

const { Proxy, locateNS } = require("./lib/proxy.js")
const { Daemon, expose } = require("./lib/daemon.js")

exports.config = config
exports.Proxy = Proxy
exports.locateNS = locateNS
exports.Daemon = Daemon
exports.expose = expose
exports.VERSION = "2.0.0"
