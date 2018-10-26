const net = require('net')

const message = require('./message.js')
const { Proxy } = require("./proxy.js")
const { config } = require('./configuration.js')
const PromiseSocket = config.PromiseSocket


class SocketProxy extends Proxy {

    async init () {
        let socket = new net.Socket({
            readable: true,
            writable: true
        })
        this._socket = new PromiseSocket(socket)
        await this._socket.connect(this.port, this.host)
        let msgs = await this._remoteHandShake()
        Proxy.logger.debug(`init: msgs.length: ${msgs.length}`)
        for (let msg of msgs) {
            // Proxy.logger.debug(`init: ${msg.data}`)
            let data = JSON.parse(msg.data)
            // Proxy.logger.debug(`init: ${JSON.stringify(data)}`)
            if ('handshake' in data) {
                this._setAttrsMethods(data.meta)
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
