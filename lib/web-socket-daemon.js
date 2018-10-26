const http = require('http')

const WsServer = require('socket.io')

const { SocketDaemon } = require('./socket-daemon.js')

class WebSocketDaemon extends SocketDaemon {
    async init () {
        this._server = http.createServer()
        this._io = new WsServer(this._server, {
            path: `/${constants.DAEMON_NAME}`,
            serveClient: false
        })
        return new Promise((resolve, reject) => {
            this._io.on('connect', this._onConnection())
            this._server.listen(this.port)
        })
    }

    async _handleHandshake (socket, msg) {
        // console.debug(`_handleHandshake`)
        var data = JSON.parse(msg.data)
        var msgResponse = this._handShake(data.object)
        var msgBytes = msgResponse.toBytes()
        // console.debug(`_handleHandshake: sending ${msgBytes} to client`)
        return new Promise((resolve, reject) => {
            socket.emit('data', msgBytes)
            resolve()
        })
    }

    async _handleInvoke (socket, msg) {
        // console.debug(`_handleInvoke: msg.data: ${msg.data}`)
        // console.debug(`_handleInvoke: msg.seq: ${msg.seq}`)
        var data = JSON.parse(msg.data)
        var { object, method, params, kwargs } = data
        var msgResponse = this._invoke(object, method, params, kwargs, msg.seq)
        var msgBytes = msgResponse.toBytes()
        // console.debug(`_handleInvoke: sending ${msgBytes} to client`)
        return new Promise((resolve, reject) => {
            socket.emit('data', msgBytes)
            resolve()
        })
    }

    async close () {
        this._io.close()
        super.close()
    }
}

exports.WebSocketDaemon = WebSocketDaemon
