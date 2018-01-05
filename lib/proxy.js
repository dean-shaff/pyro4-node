const net = require('net')

const message = require("./message")

const NAMESERVER_NAME = "Pyro.NameServer"

class Proxy{
    constructor(location){
        var host = "localhost"
        var port = 9090
        var objName = ""
        if (location.constructor === Array){
            [host, port, objName] = location
        }else if (location.constructor === Object){
            host = location.host
            port = location.port
            objName = location.objName
        }
        this.host = host
        this.port = port
        this.objName = objName
        this.remoteCallQueue = []
        this.clientConnection = null
    }

    init(handler){
        this.remoteCallQueue.push({
                                emit:this._remoteHandShake(),
                                consume:this._remoteHandShakeConsume(handler)
        })
        this._renewClient()
    }

    remoteMethod(methodName, options, handler){
        options = this._processOptions(options)
        var methodCall = ()=>{
            var remoteCallData = {
                "object": this.objName,
                "params": options.args,
                "method": methodName,
                "kwargs": options.kwargs,
            }
            var remoteCallDataStr = JSON.stringify(remoteCallData)
            var remoteMsg = new message.Message(message.MSG_INVOKE, remoteCallDataStr, 0, 0)
            return remoteMsg.toBytes()
        }
        this.remoteCallQueue.push({emit:this._remoteHandShake(), consume:this._remoteHandShakeConsume()})
        this.remoteCallQueue.push({emit:methodCall, consume:handler})
        this._renewClient()

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

    _renewClient(){
        var createClient = ()=>{
            var client = net.createConnection({port: this.port}, () => {
                client.setKeepAlive(true);
                this.remoteCallQueue.forEach((remoteCall)=>{
                    client.write(remoteCall.emit())
                })
            });
            client.on('data', this.dataCallback())
            client.on('end', this.endCallback())
            client.on('error', this.errorCallback())
            client.on('drain', this.drainCallback())
            return client
        }
        if (this.clientConnection === null){
            this.clientConnection = createClient()
        }else{
            this.clientConnection.removeAllListeners("end")
            this.clientConnection.on("end", ()=>{
                this.clientConnection.destroy()
                this.clientConnection = createClient()
            })
        }

    }

    _remoteHandShake(){
        return ()=>{
            var remoteCallData = {
                handshake: "hello",
                object: this.objName
            }
            var remoteCallDataStr = JSON.stringify(remoteCallData)
            var remoteMsg = new message.Message(
                                    message.MSG_CONNECT,
                                    remoteCallDataStr,
                                    message.FLAGS_META_ON_CONNECT,
                                    0)
            return remoteMsg.toBytes()
        }
    }

    _remoteHandShakeConsume(handler){
        return (data)=>{
            if ("handshake" in data){
                var methods = data.meta.methods
                // console.log(`_remoteHandShakeConsume: Available methods: ${methods}`)
                methods.forEach((method)=>{
                    this[method] = function(options, handler){
                        this.remoteMethod(method,options,handler)
                    }.bind(this)
                })
            }
            if (handler != undefined){
                handler(this)
            }
        }
    }

    dataCallback(){
        return (data)=>{
            var msgs = message.Message.recv(data)
            msgs.forEach((msg, idx)=>{
                var consumeCallback = this.remoteCallQueue.shift().consume
                consumeCallback(JSON.parse(msg.data))
            })
            this.clientConnection.end()
        }
    }
    endCallback(){
        return ()=>{
            // console.log("endCallback: Connection closed.")
            // this.clientConnection.destroy()
        }
    }
    errorCallback(){
        return (error)=>{console.error(`errorCallback: ${error}`)}
    }
    drainCallback(){
        return ()=>{console.log("drainCallback: Called.")}
    }
}

class NameServerProxy extends Proxy{
    constructor(location){
        if (location.constructor === Array){
            var [host, port] = location
            location = {port: port, host: host}
        }
        location.objName = NAMESERVER_NAME
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
        this.remoteMethod("lookup",{args:[objectName]},_handler)
    }

    list(handler){
        this.remoteMethod("list",{},handler)
    }
}

const locateNS = function(location, handler){
    var ns = new NameServerProxy(location)
    handler(ns)
}

exports.Proxy = Proxy
exports.locateNS = locateNS
