const { config } = require("./lib/configuration.js")
config.logLevel.Message = "error"
config.logLevel.Proxy = "error"
config.logLevel.Daemon = "error"
config.logLevel.URI = "error"
config.logLevel.Configuration = "error"
config.logLevel.NameServer = "error"

try{
    const { PromiseSocket } = require("promise-socket")
    config.using(PromiseSocket)
} catch (err) {
    // logger.error("Couldn't find promise-socket package, defaulting to bundled implementation.")
    const { PromiseSocket } = require("./lib/promise-socket.js")
    config.using(PromiseSocket)
}

const { Proxy, NameServerProxy, locateNS } = require("./lib/proxy.js")
const { Daemon, expose } = require("./lib/daemon.js")
const { NameServerDaemon, startNs } = require("./lib/naming.js")
const { URI } = require("./lib/uri.js")

exports.config = config
exports.Proxy = Proxy
exports.NameServerProxy = NameServerProxy
exports.locateNS = locateNS
exports.Daemon = Daemon
exports.expose = expose
exports.NameServerDaemon = NameServerDaemon
exports.startNs = startNs
exports.URI = URI
exports.VERSION = "2.3.1"
