const net = require('net')

const message = require('./message.js')
const util = require('./util.js')
const constants = require('./constants.js')
const serialization = require('./serialization.js')
const { URI } = require('./uri.js')
const { config } = require('./configuration.js')
const PromiseSocket = config.PromiseSocket

class Proxy {
    constructor (uri) {
        this.uri = new URI(uri)
        this.host = this.uri.host
        this.port = this.uri.port
        this.objName = this.uri.object
        Proxy.logger.info(`constructor: ${this.host}, ${this.port}, ${this.objName}`)
        this._socket = null
        this._promiseSocket = null
    }

    /**
     * Helper method for sending and receiving a response back
     * @param  {String}  writeBytes bytes to be sent to Pyro4 Daemon
     * @return {Promise} parsed data from response
     */
    async _writeRead (writeBytes) {
        // console.time("\tPromiseSocket.write")
        await this._promiseSocket.write(
            writeBytes
        )
        // console.timeEnd("\tPromiseSocket.write")
        // console.time("\tPromiseSocket.read")
        var readBytes = await this._promiseSocket.read()
        // console.timeEnd("\tPromiseSocket.read")
        // console.time("\tMessage.recv")
        let msgs = message.Message.recv(readBytes)
        // console.timeEnd("\tMessage.recv")
        // Proxy.logger.debug(`_writeRead: mgs.length: ${msgs.length}`)
        var dataPayload = JSON.parse(msgs[0].data)
        var converted = serialization.convertFromDeserializedObj(dataPayload)
        // Proxy.logger.debug(`_writeRead: msgs[0]: ${JSON.stringify(msgs[0])}`)
        // Proxy.logger.debug(`_writeRead: dataPayload ${dataPayload}`)
        return converted
    }

    /**
     * Helper method to get the payload of a handshake message
     * @return {Promise} handshake message bytes
     */
    _remoteHandShakeMessage () {
        var remoteCallData = {
            handshake: 'hello',
            object: this.objName
        }
        var remoteCallDataStr = JSON.stringify(remoteCallData)
        var remoteMsg = new message.Message(
            message.MSG_CONNECT,
            remoteCallDataStr,
            message.FLAGS_META_ON_CONNECT,
            0
        )
        var remoteMsgBytes = remoteMsg.toBytes()
        // Proxy.logger.debug(`_remoteHandShakeMessage: ${remoteMsgBytes}`)
        return remoteMsgBytes
    }

    /**
     * do handshake with remote Daemon
     * @return {Promise} Message objects parsed from Daemon response
     */
    async _remoteHandShake () {
        await this._promiseSocket.write(
            this._remoteHandShakeMessage()
        )
        let msgs = message.Message.recv(
            await this._promiseSocket.read()
        )
        return msgs
    }

    /**
     * helper method to get payload of a Message for making a remote method call
     * @param  {String} methodName name of remote method
     * @param  {Object} options args and kwargs to send to remote Daemon
     * @return {Promise} remote method call message bytes
     */
    _remoteMethodCallMessage (methodName, ...options) {
        // Proxy.logger.debug(`_remoteMethodCallMessage: ${JSON.stringify(options)}`)
        // console.time("\t_remoteMethodCallMessage")
        // console.time("\t\t_processOptions")
        options = this._processOptions(...options)
        // console.timeEnd("\t\t_processOptions")
        // console.time("\t\tremoteCallData")
        var remoteCallData = {
            object: this.objName,
            params: options.args,
            method: methodName,
            kwargs: options.kwargs
        }
        var remoteCallDataStr = JSON.stringify(remoteCallData)
        // console.timeEnd("\t\tremoteCallData")
        // console.time("\t\tMessage.constructor")
        var remoteMsg = new message.Message(
            message.MSG_INVOKE, remoteCallDataStr, 0, 0)
        // console.timeEnd("\t\tMessage.constructor")
        // console.time("\t\tMessage.toBytes")
        var remoteMsgBytes = remoteMsg.toBytes()
        // console.timeEnd("\t\tMessage.toBytes")
        // console.timeEnd("\t_remoteMethodCallMessage")
        return remoteMsgBytes
    }

    _remoteMethodFactory (methodName) {
        return async function (options) {
            // console.time("_remoteMethodCallMessage")
            var writeBytes = this._remoteMethodCallMessage(
                methodName, options
            )
            // console.timeEnd("_remoteMethodCallMessage")
            // Proxy.logger.debug(`${methodName}: writeBytes: ${writeBytes}`)
            // console.time("_writeRead")
            var resp = await this._writeRead(writeBytes)
            // console.timeEnd("_writeRead")
            return resp
        }
    }

    _remoteAttributeFactory (attrName) {
        return {
            set: async function (value) {
                var writeBytes = this._remoteMethodCallMessage(
                    '__setattr__', [attrName, value]
                )
                // Proxy.logger.debug(`${attrName}.set: writeBytes: ${writeBytes}`)
                return this._writeRead(writeBytes)
            }.bind(this),
            get: async function () {
                var writeBytes = this._remoteMethodCallMessage(
                    '__getattr__', [attrName]
                )
                // Proxy.logger.debug(`${attrName}.get: writeBytes: ${writeBytes}`)
                return this._writeRead(writeBytes)
            }.bind(this)
        }
    }

    async init () {
        this._socket = new net.Socket({
            readable: true,
            writable: true
        })
        this._promiseSocket = new PromiseSocket(this._socket)
        await this._promiseSocket.connect(this.port, this.host)
        let msgs = await this._remoteHandShake()
        // Proxy.logger.debug(`init: msgs.length: ${msgs.length}`)
        for (let msg of msgs) {
            // Proxy.logger.debug(`init: ${msg.data}`)
            let data = JSON.parse(msg.data)
            // Proxy.logger.debug(`init: ${JSON.stringify(data)}`)
            if ('handshake' in data) {
                // add methods
                var methods = data.meta.methods
                // Proxy.logger.debug(`init: Methods: ${methods}`)
                for (let method of methods) {
                    this[method] = this._remoteMethodFactory(method).bind(this)
                }
                // add attributes
                var attrs = data.meta.attrs
                // Proxy.logger.debug(`init: Attributes: ${attrs}`)
                for (let attr of attrs) {
                    if (!(attr in this)) {
                        this[attr] = this._remoteAttributeFactory(attr)
                        // this._remoteAttributeFactory(attr)
                    }
                }
            }
        }
        return this
    }

    async end () {
        await this._promiseSocket.end()
    }

    _processOptions (...options) {
        // Proxy.logger.debug(`_processOptions: ${JSON.stringify(options)}`)
        var args = []
        var kwargs = {}
        if (options.length === 2) {
            [args, kwargs] = options
        } else if (options.length === 1) {
            var argsOrKwargs = options[0]
            if (argsOrKwargs !== undefined && argsOrKwargs !== null) {
                if (argsOrKwargs.constructor === Object) {
                    kwargs = argsOrKwargs
                } else if (argsOrKwargs.constructor === Array) {
                    args = argsOrKwargs
                }
            }
        }
        return {
            args: args,
            kwargs: kwargs
        }
    }
}

/**
 * A "context manager" for accessing a Proxy.
 * This chains together the "init" and "end" async functions, placing
 * the handler async function in between
 * @param  {Object} location location object
 * @param  {Async Function} handler  async Function that gets awaited
 * between calls to init and end
 * @return {Promise}          [description]
 */
Proxy.with = async function (location, handler) {
    var proxy = new Proxy(location)
    var promise = proxy.init()
    promise.then(() => {
        return proxy
    }).then(async (proxy) => {
        await handler(proxy)
        return proxy
    }).then((proxy) => {
        proxy.end()
    })
    return promise
}

Proxy.logger = util.defaultLogger('Proxy')

class NameServerProxy extends Proxy {
    constructor (location) {
        var {
            host,
            port
        } = util.locationParser(location)
        var objName = constants.NAMESERVER_NAME
        var uri = new URI({
            port: port,
            host: host,
            objName: objName
        })
        super(uri)
    }
}

/**
 * A "context manager" for accessing the nameserver.
 * This chains together the "init" and "end" promises, inserting
 * handler (an async Function) in between
 * @param  {Array} args [location, handler]
 * @return {Promise}
 */
const locateNS = async function (...args) {
    var location
    var handler
    if (args.length === 1) {
        [handler] = args
    } else {
        [location, handler] = args
    }
    var ns = new NameServerProxy(location)
    var promise = ns.init()
    promise.then(() => {
        return ns
    }).then(async (ns) => {
        await handler(ns)
        return ns
    }).then((ns) => {
        ns.end()
    })
    return promise
}

exports.Proxy = Proxy
exports.NameServerProxy = NameServerProxy
exports.locateNS = locateNS
