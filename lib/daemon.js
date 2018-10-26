const net = require('net')
const http = require('http')

const WsServer = require("socket.io")
const uuid4 = require('uuid4')

const util = require('./util.js')
const message = require('./message.js')
const constants = require('./constants.js')
const { DaemonError } = require('./errors.js')
const { URI } = require('./uri.js')

const expose = (...args) => {
    var exposeMethod = (method) => {
        method._pyroExposed = true
    }
    var exposePropertyDescriptor = (propDescriptor) => {
        var getSet = ['get', 'set']
        getSet.forEach((name) => {
            if (name in propDescriptor) {
                propDescriptor[name]._pyroExposed = true
            }
        })
    }

    if (args.length === 1) {
        if (args[0].constructor === Object) {
            exposePropertyDescriptor(args[0])
        } else if (args[0].constructor === Function) {
            exposeMethod(args[0])
        }
    } else if (args.length === 2) {
        var [cls, prop] = args
        var propDescriptor = Object.getOwnPropertyDescriptor(
            cls.prototype, prop
        )
        exposePropertyDescriptor(propDescriptor)
    }
}

const _exposedFilter = (obj) => {
    var objProto = Object.getPrototypeOf(obj)
    return (name) => {
        if (name.startsWith('_') || name.startsWith('__')) {
            return false
        }
        var prop = Object.getOwnPropertyDescriptor(objProto, name)
        if ('value' in prop) {
            if (prop.value._pyroExposed) {
                return true
            }
        }
        var getSet = ['get', 'set']
        var getSetBool = false
        getSet.forEach((n) => {
            if (prop[n]) {
                if (prop[n]._pyroExposed) {
                    getSetBool = true
                }
            }
        })
        return getSetBool
    }
}

class Daemon {
    constructor (location) {
        location = util.locationParser(location)
        // Daemon.logger.debug(`Daemon.constructor: location: ${JSON.stringify(location)}`)
        this.host = location.host
        this.port = location.port
        this.registeredObjects = {}
        var attrNames = util.getObjAttributes(this)[0]
        var methodNames = util.getObjMethods(this)[0]
        this.registeredObjects[constants.DAEMON_NAME] = [
            this,
            {
                methods: methodNames.filter(_exposedFilter(this)),
                attrs: attrNames.filter(_exposedFilter(this)),
                oneway: []
            }
        ]
        this._server = null
    }

    register (obj, options) {
        var objectId = obj.constructor.name + uuid4()
        if (options !== undefined && options !== null) {
            if (options.constructor === Object) {
                if ('objectId' in options) {
                    objectId = options.objectId
                }
            }
        }
        // Daemon.logger.debug(
        //     `register: registering object with objectId: ${objectId}`)
        var attrNames = util.getObjAttributes(obj)[0]
        var methodNames = util.getObjMethods(obj)[0]
        // Daemon.logger.debug(
        //     `register: attribute names: ${attrNames}`
        // )
        // Daemon.logger.debug(
        //     `register: method names: ${methodNames}`
        // )
        this.registeredObjects[objectId] = [
            obj, {
                methods: methodNames.filter(_exposedFilter(obj)),
                attrs: attrNames.filter(_exposedFilter(obj)),
                oneway: []
            }
        ]
        // Daemon.logger.debug(
        //     `register: new registered object details: ${JSON.stringify(this.registeredObjects[objectId])}`)
        return new URI(
            { objName: objectId, host: this.host, port: this.port }
        )
    }

    /**
     * Unregister some object from this daemon.
     * @param  {Object/String} objOrId the object we wish to unregister, or
     * a string correponding to the object's registered ID
     * @return {null}
     */
    unregister (objOrId) {
        var targetObjectId
        if (objOrId.constructor === Object) {
            Object.keys(this.registeredObjects).forEach((objectId) => {
                let obj = this.registeredObjects[objectId][0]
                if (objOrId === obj) {
                    targetObjectId = objectId
                }
            })
        } else if (objOrId.constructor === String) {
            targetObjectId = objOrId
        }
        if (targetObjectId === undefined) {
            throw new DaemonError(`unregister: Couldn't find object ${objOrId}`)
        } else {
            Daemon.logger.info(
                `unregister: Unregistering object with ID ${targetObjectId}`)
            delete this.registeredObjects[targetObjectId]
        }
    }

    /**
     * get information about an object and return it to the client.
     * @param  {String} objectId object's registered ID
     * @return {Object}          Object containing the the names of methods,
     *                           attributes, and oneway methods.
     */
    getMetadata (objectId) {
        if (objectId in this.registeredObjects) {
            return this.registeredObjects[objectId][1]
        } else {
            throw new DaemonError(
                `get_metadata: No object registered with object ID ${objectId}`)
        }
    }

    ping () { return null }

    registered () {
        return Object.keys(this.registeredObjects)
    }

    info () {
        return `${constants.DAEMON_NAME} bound on ${this.locationStr}, ` +
               `with ${Object.keys(this.registeredObjects).length} objects registered`
    }

    get locationStr () {
        return `${this.host}:${this.port}`
    }

    uriFor (objectOrId) {
        if (objectOrId.constructor === String) {
            if (objectOrId in this.registeredObjects) {
                return new URI(`PYRO:${objectOrId}@${this.locationStr}`)
            }
        } else {
            var objectId = null
            Object.keys(this.registeredObjects).forEach((id) => {
                var obj = this.registeredObjects[id][0]
                if (obj === objectOrId) {
                    objectId = id
                } else {
                    return null
                }
            })
            if (objectId === null) {
                throw new DaemonError(`Couldn't find object ${objectOrId}`)
            } else {
                return new URI(`PYRO:${objectId}@${this.locationStr}`)
            }
        }
    }
}

class SocketDaemon extends Daemon {

    async init () {
        this._server = new net.Server()
        return new Promise((resolve, reject) => {
            this._server.on('connection', this._onConnection())
            this._server.listen({ port: this.port, host: this.host }, resolve)
        })
    }

    _handShake (objectId) {
        // Daemon.logger.debug(`_handShake: objectId: ${objectId}`)
        if (!(objectId in this.registeredObjects)) {
            throw new DaemonError(`_handShake: No object registered with object ID ${objectId}`)
        }
        var response = {
            handshake: 'hello',
            meta: this.registeredObjects[objectId][1]
        }
        var responsePayload = JSON.stringify(response)
        var msgType = message.MSG_CONNECTOK
        var msgResponse = new message.Message(
            msgType, responsePayload, 0, 0)
        return msgResponse
    }

    async _handleHandshake (socket, msg) {
        // Daemon.logger.debug(`_handleHandshake`)
        var data = JSON.parse(msg.data)
        var msgResponse = this._handShake(data.object)
        var msgBytes = msgResponse.toBytes()
        // Daemon.logger.debug(`_handleHandshake: sending ${msgBytes} to client`)
        return new Promise((resolve, reject) => {
            socket.write(msgBytes, resolve)
        })
    }

    _invoke (object, method, params, kwargs, msgSeq) {
        // Daemon.logger.debug(`_invoke: objectId: ${object}`)
        var result
        if (object in this.registeredObjects) {
            var objInfo = this.registeredObjects[object]
            var objectMethods = objInfo[1].methods
            var obj = objInfo[0]
            if (method === '__getattr__') {
                result = obj[params[0]]
            } else if (method === '__setattr__') {
                result = (obj[params[0]] = params[1])
            } else if (objectMethods.includes(method)) {
                result = obj[method](...params)
                if (result === undefined) {
                    result = null
                }
            } else {
                throw new DaemonError(`_handleInvoke: Can't find method ${method} in this Daemon`)
            }
        } else {
            throw new DaemonError(`_handleInvoke: Can't find object ${object} in this Daemon`)
        }
        var resultSerialized = JSON.stringify(result)
        var msgResponse = new message.Message(
            message.MSG_RESULT, resultSerialized, 0, msgSeq
        )
        return msgResponse
    }

    async _handleInvoke (socket, msg) {
        // Daemon.logger.debug(`_handleInvoke: msg.data: ${msg.data}`)
        // Daemon.logger.debug(`_handleInvoke: msg.seq: ${msg.seq}`)
        var data = JSON.parse(msg.data)
        var { object, method, params, kwargs } = data
        var msgResponse = this._invoke(object, method, params, kwargs, msg.seq)
        var msgBytes = msgResponse.toBytes()
        // Daemon.logger.debug(`_handleInvoke: sending ${msgBytes} to client`)
        return new Promise((resolve, reject) => {
            socket.write(msgBytes, resolve)
        })
    }

    _onConnection () {
        return (socket) => {
            socket.on('data', this._onSocketData(socket))
        }
    }

    _onSocketData (socket) {
        return async (data) => {
            // Daemon.logger.debug(`_onSocketData`)
            var msgs = message.Message.recv(data)
            for (let msg of msgs) {
                if (msg.type === message.MSG_INVOKE) {
                    await this._handleInvoke(socket, msg)
                } else if (msg.type === message.FLAGS_META_ON_CONNECT || msg.type === message.MSG_CONNECT) {
                    await this._handleHandshake(socket, msg)
                } else {
                    throw new DaemonError("Couldn't process Message")
                }
            }
            // Daemon.logger.debug(`_onSocketData: done`)
        }
    }

    async close () {
        var connPromise = new Promise((resolve, reject) => {
            this._server.getConnections(resolve)
        })
        return new Promise(async (resolve, reject) => {
            var connections = await connPromise
            if (connections !== null) {
                await Promise.all(connections.map((conn) => {
                    return new Promise((resolve, reject) => {
                        conn.once('end', resolve)
                        conn.end()
                    })
                }))
            }
            this._server.once('close', resolve)
            this._server.close()
        })
    }
}

class WebSocketDaemon extends SocketDaemon {

    async init () {
        this._server = new http.createServer()
        this._io = new WsServer(this._server, {
            path:`/${constants.DAEMON_NAME}`,
            serveClient: false
        })
        return new Promise((resolve, reject) => {
            this._io.on("connect", this._onConnection())
            this._server.listen(this.port)
        })
    }

    async close () {
        this._io.close()
        super.close()
    }
}


Daemon.prototype.get_metadata = Daemon.prototype.getMetadata
Daemon.logger = util.defaultLogger('Daemon')
expose(Daemon.prototype.get_metadata)
expose(Daemon.prototype.ping)
expose(Daemon.prototype.info)
expose(Daemon.prototype.registered)

exports.expose = expose
exports.Daemon = Daemon
exports.SocketDaemon = SocketDaemon
exports.WebSocketDaemon = WebSocketDaemon
