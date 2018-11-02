const io = require('socket.io-client')

const constants = require('./../constants.js')
const message = require('./../message.js')
const { ProxyBase } = require('./proxy-base.js')

class WebSocketProxy extends ProxyBase {

    constructor (uri) {
        super(uri)
        this._socket = null
        this._proxyName = "WebSocketProxy"
    }

    async init () {
        var address = `http://${this.host}:${this.port}`
        this._socket = io(address, { path: `/${constants.DAEMON_NAME}` })
        let msgs = await this._remoteHandShake()
        // console.debug(`init: msgs.length: ${msgs.length}`)
        for (let msg of msgs) {
            // console.debug(`init: ${msg.data}`)
            let data = JSON.parse(msg.data)
            // console.debug(`init: ${JSON.stringify(data)}`)
            if ('handshake' in data) {
                this._setAttrsMethods(data.meta)
            }
        }
        this._socket.on('data', this.onData())
        return this
    }

    async _write (writeBytes) {
        this._socket.emit('data', writeBytes)
    }

    async _writeRead (writeBytes) {
        var readBytes = await new Promise((resolve, reject) => {
            this._socket.once('data', resolve)
            this._socket.emit('data', writeBytes)
        })
        var msgs = message.Message.recv(readBytes)
        return msgs
    }

    async end () {
        return new Promise((resolve, reject) => {
            this._socket.once('disconnect', resolve)
            this._socket.disconnect()
        })
    }
}

exports.WebSocketProxy = WebSocketProxy
