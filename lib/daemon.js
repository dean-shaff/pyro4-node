const net = require("net")
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format

const message = require("./message")
const util = require("./util")
const { config } = require("./configuration")
const { ConnectionError, DaemonError } = require("./errors")

const logger = createLogger({
    level: config.logLevel.Daemon,
    transports:[
        new transports.Console()
    ],
    format: combine(
        label({ label: 'Daemon' }),
        util.formatter
    )
})
config.on("logLevel.Daemon", (level)=>{
    Daemon.logger.level = level
})


const asnyc = (fn)=>{
    fn._async = true
    return fn
}

const expose = (fn)=>{
    fn._pyroExposed = true
    return fn
}

const exposedFilter = (obj) => {
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

/**
 * The Daemon is the object that intercepts incoming socket data and calls
 * the appropriate exposed function or method. This acts in a similar manner to
 * Irmen de Jong's Pyro4 Daemon class, but the internals are very different, as
 * socket communication works via event handlers in node (one does not simply
 * write a message and then wait for a response).
 */
class Daemon{
    constructor(location){
        location = util.locationParser(location)
        this.host = location.host
        this.port = location.port
        this.objName = location.objName
        this.registeredObjects = {"Pyro.Daemon":[
                                        this,
                                        {
                                            methods:util.getObjMethods(this, {filterCb: exposedFilter(this)}),
                                            attrs:[],
                                            oneway:[]
                                        }
                                    ]
                                }
    }

    _onConnect(){
        return (conn)=>{
            logger.debug("client connected")
            conn.on("end", this._onEnd(conn))
            conn.on("data",this._onData(conn))
        }
    }

    _onData(conn){
        var handShook = false
        var handleRequest = (msg)=>{
            if (msg.type == message.MSG_INVOKE){
                logger.debug(`msg.data: ${msg.data}`)
                logger.debug(`msg.seq: ${msg.seq}`)
                var data = JSON.parse(msg.data)
                var methodName = data.method
                var methodArgs = data.params
                var methodKwargs = data.kwargs
                var objId = data.object

                logger.debug(`objId: ${objId}`)

                var objInfo = this.registeredObjects[objId]

                if (objInfo[1].methods.includes(methodName)){
                    // Now actually invoke the method
                    logger.debug(`handleRequest: invoking ${methodName} from object ${objId}`)
                    var obj = objInfo[0]
                    var result = obj[methodName](methodArgs)
                    logger.debug(`handleRequest: result: ${JSON.stringify(result)}`)
                    var responsePayload = JSON.stringify(result)
                    var msgResponse = new message.Message(message.MSG_RESULT,responsePayload,0,msg.seq)
                    conn.write(msgResponse.toBytes())
                }else{
                    throw new DaemonError(`handleRequest: Can't locate method ${methodName} on object ${objId}`)
                }

            }
        }

        var handshake = (msg)=>{
            if (msg.flags === message.FLAGS_META_ON_CONNECT){
                // Object.keys(msg).forEach((key)=>{
                //     logger.debug(`${key}: ${msg[key]}`)
                // })
                var data = JSON.parse(msg.data)
                var objId = data.object
                var response = {
                    handshake: "hello",
                    meta: this.registeredObjects[objId][1]
                }
                var responsePayload = JSON.stringify(response)
                logger.debug(responsePayload)
                var msgType = message.MSG_CONNECTOK
                var msgResponse = new message.Message(msgType,responsePayload,0,0)
                conn.write(msgResponse.toBytes())
                handShook = true
            }else{
                throw new ConnectionError("Can't establish handshake")
            }
        }

        return (dataBuffer)=>{
            var msgs = message.Message.recv(dataBuffer)
            logger.debug(`number of messages: ${msgs.length}`)
            logger.debug(`msgs[0].flags: ${msgs[0].flags}`)
            if (! handShook){
                handshake(msgs.shift())
            }
            msgs.forEach((msg)=>{
                handleRequest(msg)
            })
        }
    }

    _onEnd(conn){
        return ()=>{
            logger.debug("Connection closed.")
        }
    }

    register(obj, options){
        var objId = obj.constructor.name
        if (options != undefined){
            if ("objId" in options){
                objId = options.objId
            }
        }
        logger.debug(`register: registering object with objId: ${objId}`)
        var methods = util.getObjMethods(obj, {filterCb:exposedFilter(obj)})
        this.registeredObjects[objId] = [obj,{ methods:methods, attrs:[], oneway: []}]
    }

    get_metadata(objId){
        if (objId in this.registeredObjects){
            return this.registeredObjects[objId][1]
        }else{
            throw new DaemonError(`No object registered with object ID ${objId}`)
        }
    }
}

expose(Daemon.prototype.get_metadata)

exports.expose = expose
exports.Daemon = Daemon
