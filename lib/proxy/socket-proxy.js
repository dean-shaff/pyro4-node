const net = require('net')

const message = require('./../message.js')
const { PromiseSocket } = require('./../promise-socket.js')
const { ProxyBase, ProxyError } = require('./proxy-base.js')

class SocketProxy extends ProxyBase {

    constructor (uri) {
        super(uri)
        this._socket = null
        this._proxyName = "SocketProxy"
        if (this.uri.protocol !== 'PYRO') {
            throw new ProxyError('SocketProxy proxy is for use with PYRO protocol')
        }
    }

    async init () {
        let socket = new net.Socket({
            readable: true,
            writable: true
        })
        this._socket = new PromiseSocket(socket)
        await this._socket.connect(this.port, this.host)
        let msgs = await this._remoteHandShake()
        for (let msg of msgs) {
            // console.debug(`init: ${msg.data}`)
            let data = JSON.parse(msg.data)
            // console.debug(`init: ${JSON.stringify(data)}`)
            if (data.constructor === Object && data !== null){
                if ('handshake' in data) {
                    this._setAttrsMethods(data.meta)
                }
            }
        }
        this._socket._socket.on('data', this.onData())
        return this
    }

    async _writeRead (writeBytes) {
        await this._socket.write(writeBytes)
        var readBytes = await this._socket.read()
        var msgs = message.Message.recv(readBytes)
        return msgs
    }

    async _write (writeBytes) {
        await this._socket.write(writeBytes)
    }

    async end () {
        await this._socket.end()
    }
}

exports.SocketProxy = SocketProxy
