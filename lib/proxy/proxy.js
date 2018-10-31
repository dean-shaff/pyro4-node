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
        } else if (this.uri.protocol === "WS") {
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


async function main () {
    var proxy = new Proxy("PYRO:TestServer@localhost:50001")
    await proxy.init()
    console.log(await proxy.square([2]))
    await proxy.end()
}

main()


exports.ProxyBase = ProxyBase
exports.SocketProxy = SocketProxy
exports.WebSocketProxy = WebSocketProxy
exports.Proxy = Proxy
