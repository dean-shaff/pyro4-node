const assert = require('assert')

const { mochaResolvePromise } = require('./helper.js')
const { wait } = require('./../lib/util.js')
const { SocketDaemon, WebSocketDaemon } = require('./../lib/daemon/daemon.js')
const { TestServer } = require('./test-server.js')

describe('DaemonIntegration', function () {
    var daemonCls = [
        SocketDaemon,
        WebSocketDaemon
    ]
    var locations = [
        { host: 'localhost', port: 50001 },
        { host: 'localhost', port: 50002 }
    ]
    var servers = []
    var daemons = []

    before(function () {
        daemonCls.forEach((cls, idx) => {
            var server = new TestServer()
            servers.push(server)
            daemons.push(new cls(locations[idx]))
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
})
