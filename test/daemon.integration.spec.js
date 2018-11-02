const assert = require('assert')

const { mochaResolvePromise } = require('./helper.js')
const { TestServer } = require('./test-server.js')

const { wait } = require('./../lib/util.js')
const { SocketDaemon, WebSocketDaemon } = require('./../lib/daemon/daemon.js')
const { Proxy } = require('./../lib/proxy/proxy.js')

describe('DaemonIntegration', function () {
    var daemonCls = [
        SocketDaemon,
        WebSocketDaemon
    ]
    var locations = [
        { host: 'localhost', port: 50004 },
        { host: 'localhost', port: 50005 }
    ]
    var servers = []
    var daemons = []

    before(function () {
        daemonCls.forEach((cls, idx) => {
            var server = new TestServer()
            var daemon = new cls(locations[idx])
            servers.push(server)
            daemons.push(daemon)
        })
    })

    describe('init', function () {
        it('should be able to listen for incoming connections', function (done) {
            var p = daemons.map((daemon) => {
                return daemon.init().then(() => {
                    wait(100)
                }).then(() => {
                    daemon.close()
                })
            })
            mochaResolvePromise(Promise.all(p), done)
        })
    })

    describe('invoke', function () {
        it('a proxy should be able to connect and invoke a method', function (done) {
            var p = daemons.map((daemon, idx) => {
                var proxy
                return daemon.init().then(() => {
                    var uri = daemon.register(servers[idx])
                    proxy = new Proxy(uri)
                    return proxy.init()
                }).then((proxy) => {
                    return proxy.square([2])
                }).then((resp) => {
                    assert.strictEqual(resp, 4)
                    return proxy.end()
                }).then(() => {
                    return daemon.close()
                })
            })
            mochaResolvePromise(Promise.all(p), done)
        })
    })
})
