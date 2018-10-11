const net = require('net')

const uuid4 = require('uuid4')

const util = require("./util.js")
const message = require("./message.js")
const { config } = require("./configuration.js")
const { ConnectionError, DaemonError } = require("./errors.js")
const { URI } = require("./uri.js")
const PromiseSocket = config.PromiseSocket

const async = (fn)=>{
    fn._async = true
    return fn
}

const expose = (fn)=>{
    fn._pyroExposed = true
    return fn
}

const _exposedFilter = (obj) => {
    return (item)=>{
        if (item.startsWith("_") || item.startsWith("__")){
            return false
        }else if (obj[item] != undefined){
            if (obj[item]._pyroExposed){
                return true
            }
        }else{
            return false
        }
    }
}


class Daemon{
    constructor(location){
        location = util.locationParser(location)
        this.host = location.host
        this.port = location.port
        this.registeredObjects = {
            "Pyro.Daemon":[
                this,
                {
                    methods: util.getObjMethods(this)
                                 .filter(_exposedFilter(this)),
                    attrs:[],
                    oneway:[]
                }
            ]
        }
        this._server = null
    }

    async init(options){
        this._server = new net.Server()
        this._server.on("connection", this._onConnection())
        return new Promise((resolve, reject)=>{
            this._server.listen({port: this.port, host: this.host}, resolve)
        })
    }

    register(obj, options){
        var objectId = obj.constructor.name + uuid4()
        if (options != undefined){
            if (options.constructor === Object){
                if ("objectId" in options){
                    objectId = options.objectId
                }
            }
        }
        Daemon.logger.debug(
            `register: registering object with objectId: ${objectId}`)
        var methods = util.getObjMethods(obj)
                          .filter(_exposedFilter(obj))
        this.registeredObjects[objectId] = [
            obj, { methods:methods, attrs:[], oneway: []}
        ]
        return new URI(
            {objName: objectId, host: this.host, port: this.port}
        )
    }

    get_metadata(objectId){
        if (objectId in this.registeredObjects){
            return this.registeredObjects[objectId][1]
        }else{
            throw new DaemonError(`No object registered with object ID ${objectId}`)
        }
    }

    _handShake(objectId){
        Daemon.logger.debug(`_handShake`)
        var response = {
            handshake: "hello",
            meta: this.registeredObjects[objectId][1]
        }
        var responsePayload = JSON.stringify(response)
        var msgType = message.MSG_CONNECTOK
        var msgResponse = new message.Message(
            msgType, responsePayload, 0, 0)
        return msgResponse
    }

    _handleHandshake(socket, msg){
        Daemon.logger.debug(`_handleHandshake`)
        var data = JSON.parse(msg.data)
        var msgResponse = this._handShake(data.object)
        return msgResponse.toBytes().then((bytes)=>{
            return new Promise((resolve, reject)=>{
                socket.write(bytes, resolve)
            })
        })
    }

    _invoke(object, method, params, kwargs, seq){
        Daemon.logger.debug(`_invoke: objectId: ${object}`)
        if (object in this.registeredObjects){
            var objInfo = this.registeredObjects[object]
            var objectMethods = objInfo[1].methods
            if (objectMethods.includes(method)){
                var obj = objInfo[0]
                var result = obj[method](...params)
                var resultSerialized = JSON.stringify(result)
                var msgResponse = new message.Message(
                    message.MSG_RESULT, resultSerialized, 0, seq
                )
                return msgResponse
            } else {
                throw new DaemonError(`_handleInvoke: Can't find method ${method} in this Daemon`)
            }
        } else {
            throw new DaemonError(`_handleInvoke: Can't find object ${object} in this Daemon`)
        }
    }

    _handleInvoke(socket, msg){
        Daemon.logger.debug(`_handleInvoke: msg.data: ${msg.data}`)
        Daemon.logger.debug(`_handleInvoke: msg.seq: ${msg.seq}`)
        var data = JSON.parse(msg.data)
        var { object, method, params, kwargs } = data
        var msgResponse = this._invoke(object, method, params, kwargs, msg.seq)
        return msgResponse.toBytes().then((bytes)=>{
            return new Promise((resolve, reject)=>{
                socket.write(bytes, resolve)
            })
        })
    }

    _onConnection(){
        return (socket)=>{
            Daemon.logger.info(`_onConnection: ${socket}`)
            socket.on("data", this._onSocketData(socket))
        }
    }

    _onSocketData(socket){
        return (data)=>{
            message.Message.recv(data).then(async (msgs)=>{
                for (let msg of msgs){
                    if (msg.type === message.MSG_INVOKE){
                        await this._handleInvoke(socket, msg)
                    } else if (msg.type === message.FLAGS_META_ON_CONNECT){
                        await this._handleHandshake(socket, msg)
                    }
                }
            })
        }
    }

    // _onConnect(){
    //     return (conn)=>{
    //         logger.debug("client connected")
    //         conn.on("end", this._onEnd(conn))
    //         conn.on("data",this._onData(conn))
    //     }
    // }
    //
    // _onData(conn){
    //     var handShook = false
    //     var handleRequest = (msg)=>{
    //         if (msg.type == message.MSG_INVOKE){
    //             logger.debug(`msg.data: ${msg.data}`)
    //             logger.debug(`msg.seq: ${msg.seq}`)
    //             var data = JSON.parse(msg.data)
    //             var methodName = data.method
    //             var methodArgs = data.params
    //             var methodKwargs = data.kwargs
    //             var objectId = data.object
    //
    //             logger.debug(`objectId: ${objectId}`)
    //
    //             var objInfo = this.registeredObjects[objectId]
    //
    //             if (objInfo[1].methods.includes(methodName)){
    //                 // Now actually invoke the method
    //                 logger.debug(`handleRequest: invoking ${methodName} from object ${objectId}`)
    //                 var obj = objInfo[0]
    //                 var result = obj[methodName](methodArgs)
    //                 logger.debug(`handleRequest: result: ${JSON.stringify(result)}`)
    //                 var responsePayload = JSON.stringify(result)
    //                 var msgResponse = new message.Message(message.MSG_RESULT,responsePayload,0,msg.seq)
    //                 conn.write(msgResponse.toBytes())
    //             }else{
    //                 throw new DaemonError(`handleRequest: Can't locate method ${methodName} on object ${objectId}`)
    //             }
    //
    //         }
    //     }
    //
    //     var handshake = (msg)=>{
    //         if (msg.flags === message.FLAGS_META_ON_CONNECT){
    //             // Object.keys(msg).forEach((key)=>{
    //             //     logger.debug(`${key}: ${msg[key]}`)
    //             // })
    //             var data = JSON.parse(msg.data)
    //             var objectId = data.object
    //             var response = {
    //                 handshake: "hello",
    //                 meta: this.registeredObjects[objectId][1]
    //             }
    //             var responsePayload = JSON.stringify(response)
    //             logger.debug(responsePayload)
    //             var msgType = message.MSG_CONNECTOK
    //             var msgResponse = new message.Message(msgType,responsePayload,0,0)
    //             conn.write(msgResponse.toBytes())
    //             handShook = true
    //         }else{
    //             throw new ConnectionError("Can't establish handshake")
    //         }
    //     }
    //
    //     return (dataBuffer)=>{
    //         var msgs = message.Message.recv(dataBuffer)
    //         logger.debug(`number of messages: ${msgs.length}`)
    //         logger.debug(`msgs[0].flags: ${msgs[0].flags}`)
    //         if (! handShook){
    //             handshake(msgs.shift())
    //         }
    //         msgs.forEach((msg)=>{
    //             handleRequest(msg)
    //         })
    //     }
    // }
    //
    // _onEnd(conn){
    //     return ()=>{
    //         Daemon.logger.debug("Connection closed.")
    //     }
    // }
    async close(){
        var connPromise = new Promise((resolve, reject)=>{
            this._server.getConnections(resolve)
        })
        return new Promise(async (resolve, reject)=>{
            var connections = await connPromise
            if (connections !== null){
                await Promise.all(connections.map((conn)=>{
                    return new Promise((resolve, reject)=>{
                        conn.once('end', resolve)
                        conn.end()
                    })
                }))
            }
            this._server.once("close", resolve)
            this._server.close()
        })
    }
}

Daemon.with = async function(){}

Daemon.logger = util.defaultLogger("Daemon")

exports.expose = expose
exports.Daemon = Daemon
