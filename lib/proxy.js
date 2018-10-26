const message = require('./message.js')
const util = require('./util.js')
const constants = require('./constants.js')
const serialization = require('./serialization.js')
const { URI } = require('./uri.js')

class Proxy {
    constructor (uri) {
        this.uri = new URI(uri)
        this.host = this.uri.host
        this.port = this.uri.port
        this.objName = this.uri.object
        this._socket = null
        this._promiseSocket = null
        this._remoteCallQueue = []
        this._onewayMethods = []
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
        return remoteMsg
    }

    /**
     * do handshake with remote Daemon
     * @return {Promise} Message objects parsed from Daemon response
     */
    async _remoteHandShake () {
        var msg = this._remoteHandShakeMessage()
        var writeBytes = msg.toBytes()
        return this._writeRead(writeBytes)
    }

    /**
     * helper method to get payload of a Message for making a remote method call
     * @param  {String} methodName name of remote method
     * @param  {Object} options args and kwargs to send to remote Daemon
     * @return {Message} remote method call message
     */
    _remoteMethodCallMessage (methodName, ...options) {
        var flags = 0
        options = this._processOptions(...options)
        var remoteCallData = {
            object: this.objName,
            params: options.args,
            method: methodName,
            kwargs: options.kwargs
        }
        var remoteCallDataStr = JSON.stringify(remoteCallData)
        if (this._onewayMethods.includes(methodName)) {
            flags = flags | message.FLAGS_ONEWAY
        }
        var remoteMsg = new message.Message(
            message.MSG_INVOKE, remoteCallDataStr, flags, 0)
        return remoteMsg
    }

    _remoteMethodFactory (methodName) {
        return async function (options) {
            var msg = this._remoteMethodCallMessage(
                methodName, options
            )
            var writeBytes = msg.toBytes()
            // Proxy.logger.debug(`${methodName}: writeBytes: ${writeBytes}`)
            await this._write(writeBytes)
            if (msg.flags & message.FLAGS_ONEWAY) {
                return null
            }
            return new Promise((resolve, reject) => {
                this._remoteCallQueue.push(resolve)
            })
        }
    }

    _remoteAttributeFactory (attrName) {
        return {
            set: async function (value) {
                var msg = this._remoteMethodCallMessage(
                    '__setattr__', [attrName, value]
                )
                var writeBytes = msg.toBytes()
                await this._write(writeBytes)
                return new Promise((resolve, reject) => {
                    this._remoteCallQueue.push(resolve)
                })
                // Proxy.logger.debug(`${attrName}.set: writeBytes: ${writeBytes}`)
                // return this._writeRead(writeBytes)
            }.bind(this),
            get: async function () {
                var msg = this._remoteMethodCallMessage(
                    '__getattr__', [attrName]
                )
                var writeBytes = msg.toBytes()
                await this._write(writeBytes)
                return new Promise((resolve, reject) => {
                    this._remoteCallQueue.push(resolve)
                })
                // Proxy.logger.debug(`${attrName}.get: writeBytes: ${writeBytes}`)
                // return this._writeRead(writeBytes)
            }.bind(this)
        }
    }

    _setAttrsMethods (metadata) {
        // note oneway methods
        this._onewayMethods = metadata.oneway
        // add methods
        var methods = metadata.methods
        // Proxy.logger.debug(`init: Methods: ${methods}`)
        for (let method of methods) {
            this[method] = this._remoteMethodFactory(method).bind(this)
        }
        // add attributes
        var attrs = metadata.attrs
        // Proxy.logger.debug(`init: Attributes: ${attrs}`)
        for (let attr of attrs) {
            if (!(attr in this)) {
                this[attr] = this._remoteAttributeFactory(attr)
            }
        }
    }

    onData () {
        return (data) => {
            let msgs = message.Message.recv(data)
            for (let i = 0; i < msgs.length; i++) {
                let msg = msgs[i]
                let dataPayload = JSON.parse(msg.data)
                let converted = serialization.convertFromDeserializedObj(
                    dataPayload)
                let resolve = this._remoteCallQueue.shift()
                resolve(converted)
            }
        }
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
// Proxy.with = async function (location, handler) {
//     var proxy = new SocketProxy(location)
//     var promise = proxy.init()
//     promise.then(() => {
//         return proxy
//     }).then(async (proxy) => {
//         await handler(proxy)
//         return proxy
//     }).then((proxy) => {
//         proxy.end()
//     })
//     return promise
// }

// class NameServerProxy extends SocketProxy {
//     constructor (location) {
//         var {
//             host,
//             port
//         } = util.locationParser(location)
//         var objName = constants.NAMESERVER_NAME
//         var uri = new URI({
//             port: port,
//             host: host,
//             objName: objName
//         })
//         super(uri)
//     }
// }

/**
 * A "context manager" for accessing the nameserver.
 * This chains together the "init" and "end" promises, inserting
 * handler (an async Function) in between
 * @param  {Array} args [location, handler]
 * @return {Promise}
 */
// const locateNS = async function (...args) {
//     var location
//     var handler
//     if (args.length === 1) {
//         [handler] = args
//     } else {
//         [location, handler] = args
//     }
//     var ns = new NameServerProxy(location)
//     var promise = ns.init()
//     promise.then(() => {
//         return ns
//     }).then(async (ns) => {
//         await handler(ns)
//         return ns
//     }).then((ns) => {
//         ns.end()
//     })
//     return promise
// }

exports.Proxy = Proxy
// exports.NameServerProxy = NameServerProxy
// exports.SocketProxy = SocketProxy
// exports.WebSocketProxy = WebSocketProxy
// exports.locateNS = locateNS
