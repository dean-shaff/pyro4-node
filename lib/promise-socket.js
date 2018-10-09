const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

const util = require("./util.js")
const { config } = require("./configuration.js")

class PromiseSocket{
    constructor(socket){
        this._socket = socket
        this._socket.on("error", this._errorHandler())
        this._err = null
        this._closed = true
    }

    get closed(){
        return this._closed
    }

    get open(){
        return ! this._closed
    }

    async connect(port, host){
        var options = {
            port: port,
            host: host
        }
        return new Promise((resolve, reject)=>{
            this._socket.connect(options, resolve)
        }).then((resp)=>{
            this._closed = false
            return resp
        })
    }

    async write(bytes){
        return new Promise((resolve, reject)=>{
            this._socket.write(bytes, resolve)
            if (this._err !== null){
                reject(this._err)
            }
        })
    }

    async read(){
        return new Promise((resolve, reject)=>{
            this._socket.once("data", resolve)
            if (this._err !== null){
                reject(this._err)
            }
        })
    }

    async end(){
        if (! this._closed){
            return new Promise((resolve, reject)=>{
                this._socket.once("end", resolve)
                this._socket.end()
            }).then((resp)=>{
                this._closed = true
                return resp
            })
        } else {
            return new Promise((resolve, reject)=>{
                resolve()
            })
        }
    }

    _errorHandler(){
        return (err)=>{
            this._err = err
            PromiseSocket.logger.error(`PromiseSocket: ${err}`)
        }
    }
}

PromiseSocket.logger = createLogger({
    level: config.logLevel.PromiseSocket,
    transports:[
        new transports.Console()
    ],
    format: combine(
        label({ label: 'PromiseSocket' }),
        util.formatter
    )
})
config.on("logLevel.PromiseSocket", (level)=>{
    PromiseSocket.logger.level = level
})


exports.PromiseSocket = PromiseSocket
