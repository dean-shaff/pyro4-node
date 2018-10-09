const { config } = require("./../lib/configuration.js")

const { PromiseSocket } = require("./../lib/promise-socket.js")

config.logLevel.Proxy = "error"
config.logLevel.Message = "error"
config.logLevel.Daemon = "error"
config.using(PromiseSocket)
