const EventEmitter = require("events")

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

const util = require("./util.js")

class Configuration extends EventEmitter{
    constructor(){
        super()
        this.logLevel = {
            _Message: "info",
            _Proxy: "info",
            _Daemon: "info",
            _URI: "info",
            _Configuration: "info",
            _PromiseSocket: "info"
        }
        this.port = 9090
        this.host = "localhost"
        this.pyroName = "PYRO"
        this.NAMESERVER_NAME = "Pyro.NameServer"
        this.PromiseSocket = null

        Object.keys(this.logLevel).forEach((prop)=>{
            var module = prop.replace("_","")
            var self = this
            Object.defineProperty(this.logLevel, module, {
                set: function(value){
                    self.logLevel[prop] = value
                    let eventName = `logLevel.${module}`
                    self.emit(eventName, value)
                },
                get: function(){
                    return self.logLevel[prop]
                }
            })
        })
    }
    using(cls){
        if (cls.name in this){
            this[cls.name] = cls
        }
    }
}

const config = new Configuration()

Configuration.logger = createLogger({
    level: config.logLevel.Configuration,
    transports:[
        new transports.Console()
    ],
    format: combine(
        label({ label: 'Configuration' }),
        util.formatter
    )
})
config.on("logLevel.Configuration", (level)=>{
    Configuration.logger.level = level
})


exports.config = config
