/* eslint no-camel-case: 1 */

const { expose } = require('./../lib/daemon/daemon.js')

class TestServer {
    constructor () {
        this._name = 'TestServer'
    }

    get name () {
        return this._name
    }

    set name (value) {
        this._name = value
    }

    square (x) {
        return x ** 2
    }

    ping () {}

    echo (args) {
        return args
    }

    oneway_method (x) {
        return null
    }
}

var launchDaemon = (obj, daemonCls, location, ...args) => {
    var daemon = new daemonCls(location)
    var uri = daemon.register(obj, ...args)
    return daemon
}

expose(TestServer.prototype.square)
expose(TestServer.prototype.ping)
expose(TestServer.prototype.echo)
expose(TestServer.prototype.oneway_method)
expose(TestServer, 'name')

exports.TestServer = TestServer
exports.launchDaemon = launchDaemon
