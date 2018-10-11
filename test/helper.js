const { config } = require("./../lib/configuration.js")

const { PromiseSocket } = require("./../lib/promise-socket.js")

config.logLevel.Proxy = "debug"
config.logLevel.Message = "debug"
config.logLevel.Daemon = "debug"
config.using(PromiseSocket)
