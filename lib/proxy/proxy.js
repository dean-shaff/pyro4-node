const { copyObject } = require('./../util.js')

const { SocketProxy } = require('./socket-proxy.js')
const { WebSocketProxy } = require('./web-socket-proxy.js')
const { ProxyBase, ProxyError } = require('./proxy-base.js')

/**
 * A Proxy that automatically chooses which
 * @extends ProxyBase
 */
class Proxy extends ProxyBase {
    constructor (uri) {
        super(uri)
        var proxy
        if (this.uri.protocol === "PYRO") {
            proxy = new SocketProxy(this.uri)
        } else if (this.uri.protocol === "PYRO_WS") {
            proxy = new WebSocketProxy(this.uri)
        }
        if (proxy === undefined) {
            throw new ProxyError(
                `uri protocol ${this.uri.protocol} not recognized`
            )
        } else {
            copyObject(this, proxy)
        }
    }
}

exports.ProxyBase = ProxyBase
exports.SocketProxy = SocketProxy
exports.WebSocketProxy = WebSocketProxy
exports.Proxy = Proxy
