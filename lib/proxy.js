const net = require('net')

const PromiseSocket = require("promise-socket")
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format

const message = require("./message")
const util = require("./util")
const { config } = require("./configuration")
const { ConnectionError } = require("./errors")


class Proxy{
    constructor(location){
        location = util.locationParser(location)
        this.host = location.host
        this.port = location.port
        this.objName = location.objName
        Proxy.logger.debug(`constructor: ${this.host}, ${this.port}, ${this.objName}`)
        this._socket = null
        this._promiseSocket = null
    }

    async _remoteHandShakeMessage(){
        var remoteCallData = {
            handshake: "hello",
            object: this.objName
        }
        var remoteCallDataStr = JSON.stringify(remoteCallData)
        var remoteMsg = new message.Message(
            message.MSG_CONNECT,
            remoteCallDataStr,
            message.FLAGS_META_ON_CONNECT,
            0
        )
        var remoteMsgBytes = await remoteMsg.toBytes()
        return remoteMsgBytes
    }

    async _remoteHandShake(){
        await this._promiseSocket.write(
            await this._remoteHandShakeMessage()
        )
        let msgs = await message.Message.recv(
            await this._promiseSocket.read()
        )
        return msgs
    }

    async _remoteMethodCallMessage(methodName, options){
        options = this._processOptions(options)
        var remoteCallData = {
            "object": this.objName,
            "params": options.args,
            "method": methodName,
            "kwargs": options.kwargs,
        }
        var remoteCallDataStr = JSON.stringify(remoteCallData)
        var remoteMsg = new message.Message(
                message.MSG_INVOKE, remoteCallDataStr, 0, 0)
        var remoteMsgBytes = await remoteMsg.toBytes()
        return remoteMsgBytes
    }

    _remoteMethodFactory(methodName){
        return async function(options){
            await this._promiseSocket.write(
                await this._remoteMethodCallMessage(
                    methodName, options)
            )
            let msgs = await message.Message.recv(
                await this._promiseSocket.read()
            )
            return JSON.parse(msgs[0].data)
        }
    }

    // _remoteAttributeFactory(attrName){
    //
    // }

    async init(){
        this._socket = new net.Socket({readable:true, writable:true})
        this._promiseSocket = new PromiseSocket(this._socket)
        await this._promiseSocket.connect(this.port, this.host)
        let msgs = await this._remoteHandShake()
        for (let msg of msgs){
            let data = JSON.parse(msg.data)
            Proxy.logger.debug(`init: ${JSON.stringify(data)}`)
            if ("handshake" in data){
                // add methods
                var methods = data.meta.methods
                Proxy.logger.debug(`init: Methods: ${methods}`)
                for (let method of methods){
                    this[method] = this._remoteMethodFactory(method).bind(this)
                }
                // add attributes
                var attrs = data.meta.attrs
                Proxy.logger.debug(`init: Attributes: ${attrs}`)
                // for (let attr of attrs){
                //     this[attr] = this._remoteAttributeFactory(attr)
                // }
            }
        }
        return this
    }

    async end(){
        await this._promiseSocket.end()
    }

    _processOptions(options){
        var args = []
        var kwargs = {}
        if (options != undefined){
            if (options.constructor === Array){
                if (options.length == 2){
                    [args, kwargs] = options
                }else if (options.length == 1){
                    var args_or_kwargs = options[0]
                    if (args_or_kwargs.constructor === Object){
                        kwargs = args_or_kwargs
                    }else if (args_or_kwargs.constructor === Array){
                        args = args_or_kwargs
                    }
                }
            }else if (options.constructor === Object){
                if ("args" in options){
                    args = options.args
                }
                if ("kwargs" in options){
                    kwargs = options.kwargs
                }
            }
        }
        return {args: args, kwargs:kwargs}
    }
}


Proxy.logger = createLogger({
    level: config.logLevel.Proxy,
    transports:[
        new transports.Console()
    ],
    format: combine(
        label({ label: 'Proxy' }),
        util.formatter
    )
})


class NameServerProxy extends Proxy{
    constructor(location){
        if (location.constructor === Array){
            var [host, port] = location
            location = {port: port, host: host}
        }
        location.objName = config.NAMESERVER_NAME
        super(location)
    }

    /**
     * Look up some object sitting on the nameserver
     * @param  {String} objectName - the name of the object sitting on the nameserver
     * @param  {Function} handler - a callback that takes a proxy argument
     * @return {null}
     */
    lookup(objectName, handler){
        var _handler = (data)=>{
            var [PYRO, objName, Idontknow, host, port] = data.state
            var location = {
                objName: objName,
                port: port,
                host: host
            }
            var proxy = new Proxy(location)
            proxy.init(handler)
        }
        this.remoteMethod("lookup", {args:[objectName]}, _handler)
    }

    list(handler){
        this.remoteMethod("list", {}, handler)
    }
}

const locateNS = function(location, handler){
    var ns = new NameServerProxy(location)
    handler(ns)
}

exports.Proxy = Proxy
exports.locateNS = locateNS
