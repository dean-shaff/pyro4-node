const net = require('net')

const { Daemon } = require('./daemon.js')
const { DaemonError } = require('./errors.js')

class SocketDaemon extends Daemon {
    async init () {
        this._server = new net.Server()
        return new Promise((resolve, reject) => {
            this._server.on('connection', this._onConnection())
            this._server.listen({ port: this.port, host: this.host }, resolve)
        })
    }

    _onConnection () {
        return (socket) => {
            // console.debug("connection")
            socket.on('data', this._onSocketData(socket))
        }
    }

    _onSocketData (socket) {
        return async (data) => {
            // console.debug(`_onSocketData`)
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
        }
    }

    async _handleHandshake (socket, msg) {
        // console.debug(`_handleHandshake`)
        var data = JSON.parse(msg.data)
        var msgResponse = this._handShake(data.object)
        var msgBytes = msgResponse.toBytes()
        // console.debug(`_handleHandshake: sending ${msgBytes} to client`)
        return new Promise((resolve, reject) => {
            socket.write(msgBytes, resolve)
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
            socket.write(msgBytes, resolve)
        })
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

exports.SocketDaemon = SocketDaemon
