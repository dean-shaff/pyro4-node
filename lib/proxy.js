const net = require('net')

const Promise = require("promise")
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
        this.remoteCallQueue = []
        this.clientConnection = null
    }

    init(handler, errorHandler){
        if (errorHandler == undefined){errorHandler = null}
        this.remoteCallQueue.push({
                                emit:this._remoteHandShake(),
                                consume:this._remoteHandShakeConsume(handler),
                                error:errorHandler
        })
        this._writeRemoteCallData()
    }

    /**
     * Make a "batch" call. This means that multiple calls get bundled up
     * together and use the same net.clientConnection, instead of recreating
     * the connection between each call.
     * My very informal tests (simply timing two scripts with the bash `time`
     * command) lead me to believe that batched commands can be twice as fast
     * as making recursive calls to the `remoteMethod` function.
     * @param  {Array} calls - An array of Objects with the following signature:
     *      - methodName {String}: name of method to call
     *      - options {Object}: options object from `remoteMethod`
     *      - handler {Function}: Callback for when data is ready.
     *      - errorHandler {Function, optional}: errorHandler function
     * OR
     *      An array of functions resulting from this.deferedCall
     * @param {Function} initErrorHandler - The errorhandler to use for the
     *      handshake.
     * @return {null}
     */
    batch(calls, initErrorHandler){
        if (initErrorHandler == undefined){initErrorHandler = null}
        this.remoteCallQueue.push(
            {emit:this._remoteHandShake(), consume:this._remoteHandShakeConsume(), error:initErrorHandler}
        )
        calls.forEach((callObj)=>{
            if (callObj.constructor === Function){
                this.remoteCallQueue.push(callObj())
            }else{
                this.remoteCallQueue.push(
                    this.deferedCall(callObj.methodName, callObj.options, callObj.handler, callObj.errorHandler)()
                )
            }
        })
        this._writeRemoteCallData()
    }

    remoteMethod(methodName, options, handler, errorHandler){
        Proxy.logger.debug(`remoteMethod: Called. arguments.length: ${arguments.length}`)
        var methodCall = this._methodCallFactory(methodName, options)
        // this.remoteCallQueue.push(
        //              {emit:this._remoteHandShake(), consume:this._remoteHandShakeConsume(), error:errorHandler}
        // )
        if (arguments.length > 2){
            if (errorHandler == undefined){errorHandler = null}
            this.remoteCallQueue.push({emit:methodCall, consume:handler, error:errorHandler})
            this._writeRemoteCallData()
        }else{
            return new Promise((resolve, reject)=>{
                this.remoteCallQueue.push({emit:methodCall, consume:resolve, error:reject})
                this._writeRemoteCallData()
            })
        }
    }

    // remoteMethodPromise(methodName, options){
    //     Proxy.logger.debug(`remoteMethodPromise: Called. arguments.length: ${arguments.length}`)
    //     var methodCall = this._methodCallFactory(methodName, options)
    //     return new Promise((handler, errorHandler)=>{
    //         Proxy.logger.debug("remoteMethodPromise Promise called.")
    //         this.remoteCallQueue.push({emit:methodCall, consume:handler, error:errorHandler})
    //         this._writeRemoteCallData()
    //     })
    // }

    _methodCallFactory(methodName, options){
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
        return methodCall
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

    _writeRemoteCallData(){
        Proxy.logger.debug(`_writeRemoteCallData: Called.`)
        var createClient = ()=>{
            var client = net.createConnection({port: this.port, host:this.host}, () => {
                // client.setKeepAlive(false);
                this.remoteCallQueue.forEach((remoteCall)=>{
                    client.write(remoteCall.emit())
                })
            });
            client.on('data', this.onData())
            client.on('end', this.onEnd())
            client.on('error', this.onError())
            // client.on('drain', this.onDrain())
            return client
        }
        if (this.clientConnection === null){
            Proxy.logger.debug("_writeRemoteCallData: Creating new client connection")
            this.clientConnection = createClient()
        }else{
            Proxy.logger.debug("_writeRemoteCallData: Client already exists. Writing data.")
            this.remoteCallQueue.forEach((remoteCall)=>{
                this.clientConnection.write(remoteCall.emit())
            })
        }
        // else{
        //     Proxy.logger.debug("_writeRemoteCallData: Recreating client connection")
        //     this.clientConnection.removeAllListeners("end")
        //     this.clientConnection.on("end", ()=>{
        //         this.clientConnection.destroy()
        //         this.clientConnection = createClient()
        //     })
        // }

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
        return (data, proxy)=>{
            if (data.constructor === String && data === "unknown object"){
                throw new ConnectionError("_remoteHandShakeConsume: Unknown object -- connection details may be incorrect");
            }
            if ("handshake" in data){
                Proxy.logger.debug(`_remoteHandShakeConsume: ${JSON.stringify(data.meta)}`)
                var methods = data.meta.methods
                // console.log(`_remoteHandShakeConsume: Available methods: ${methods}`)
                methods.forEach((method)=>{
                    this[method] = function(options, handler, errorHandler){
                        this.remoteMethod(method,options,handler,errorHandler)
                    }.bind(this)
                })
            }
            if (handler != undefined){
                handler(this)
            }
        }
    }

    onData(){
        return (data)=>{
            Proxy.logger.debug("onData: Called.")
            Proxy.logger.debug(`onData: data.length, data.constructor: ${data.length}, ${data.constructor.name}`)
            var msgs = message.Message.recv(data)
            Proxy.logger.debug(`onData: Got ${msgs.length} messages`)
            msgs.forEach((msg, idx)=>{
                // Proxy.logger.debug(`onData: looping through messages, current message: ${idx} `)
                var remoteCallbacks = this.remoteCallQueue.shift()
                var consumeCallback = remoteCallbacks.consume
                var onError = remoteCallbacks.error
                if (onError == null){
                    consumeCallback(JSON.parse(msg.data), this)
                }else{
                    try{
                        consumeCallback(JSON.parse(msg.data), this)
                    }catch (err){
                        onError(err)
                    }
                }
            })
        }
    }
    onEnd(){
        return ()=>{
            Proxy.logger.debug("onEnd: Called.")
            this.clientConnection.destroy()
        }
    }
    onError(){
        return (error)=>{Proxy.logger.error(`onError: ${error}`)}
    }
    onDrain(){
        return ()=>{Proxy.logger.debug("onDrain: Called.")}
    }

    done(){
        if (this.clientConnection != undefined){
            this.clientConnection.end()
        }
    }

    /**
     * [deferedCall description]
     * @param  {[type]} methodName   [description]
     * @param  {[type]} options      [description]
     * @param  {[type]} handler      [description]
     * @param  {[type]} errorHandler [description]
     * @return {[type]}              [description]
     */
    deferedCall(methodName, options, handler, errorHandler){
        if (errorHandler == undefined){errorHandler = null}
        var methodCall = this._methodCallFactory(methodName, options)
        return ()=>{return {emit: methodCall, consume: handler, error:errorHandler}}
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
