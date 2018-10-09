const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

const util = require("./util.js")
const { config } = require("./configuration.js")

class URI{
    constructor(uri){
        var protocol = "PYRO"
        if (uri.constructor === URI){
            var state = uri.state
            this.state = state
            return
        } else if (uri.constructor === Object){
            var {host, port, objName} = uri
        } else if (uri.constructor === String){
            var {protocol, host, port, objName} = this._parseStringURI(uri)
        }
        this.protocol = protocol
        this.host = host
        this.port = port
        this.object = objName
    }

    _parseStringURI(uri){
        var [protocol, objNameHost, port] = uri.split(":")
        var [objName, host] = objNameHost.split("@")
        return {
            protocol: protocol,
            host: host,
            port: parseInt(port),
            objName, objName
        }
    }

    set state(value){
        this.protocol = value.protocol
        this.host = value.host
        this.port = value.port
        this.object = value.object
    }

    get state(){
        return {
            protocol: this.protocol,
            host: this.host,
            port: this.port,
            object: this.object
        }
    }

    get location(){
        return `${this.host}:${this.port}`
    }

    get str(){
        return `${this.protocol}:${this.object}@${this.host}:${this.port}`
    }

}

URI.logger = createLogger({
    level: config.logLevel.URI,
    transports:[
        new transports.Console()
    ],
    format: combine(
        label({ label: 'URI' }),
        util.formatter
    )
})
config.on("logLevel.URI", (level)=>{
    URI.logger.level = level
})


exports.URI = URI
