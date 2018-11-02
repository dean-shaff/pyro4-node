// const util = require('./util.js')

class PromiseSocket {
    constructor (socket) {
        this._socket = socket
        this._socket.on('error', this._errorHandler())
        this._err = null
        this._closed = true
    }

    get closed () {
        return this._closed
    }

    get open () {
        return !this._closed
    }

    async connect (port, host) {
        var options = {
            port: port,
            host: host
        }
        return new Promise((resolve, reject) => {
            this._socket.connect(options, resolve)
            if (this._err !== null) {
                reject(this._err)
            }
        }).then((resp) => {
            this._closed = false
            return resp
        }).catch((err) => {
            throw err
        })
    }

    async write (bytes) {
        return new Promise((resolve, reject) => {
            this._socket.write(bytes, resolve)
            if (this._err !== null) {
                reject(this._err)
            }
        }).catch((err) => {
            throw err
        })
    }

    async read () {
        return new Promise((resolve, reject) => {
            this._socket.once('data', resolve)
            if (this._err !== null) {
                reject(this._err)
            }
        }).catch((err) => {
            throw err
        })
    }

    async end () {
        if (!this._closed) {
            return new Promise((resolve, reject) => {
                this._socket.once('end', resolve)
                this._socket.end()
            }).then((resp) => {
                this._closed = true
                return resp
            }).catch((err) => {
                throw err
            })
        } else {
            return new Promise((resolve, reject) => {
                resolve()
            }).catch((err) => {
                throw err
            })
        }
    }

    _errorHandler () {
        return (err) => {
            this._err = err
            console.error(`PromiseSocket: ${err}`)
        }
    }
}

exports.PromiseSocket = PromiseSocket
