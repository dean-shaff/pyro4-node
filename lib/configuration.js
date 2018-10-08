const EventEmitter = require("events")


class Configuration extends EventEmitter{
    constructor(){
        super()
        this.logLevel = {
            _Message: "info",
            _Proxy: "info",
            _Daemon: "info",
            _URI: "info"
        }
        this.port = 9090
        this.host = "localhost"
        this.pyroName = "PYRO"
        this.NAMESERVER_NAME = "Pyro.NameServer"
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
}


exports.config = new Configuration()
