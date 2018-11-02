const assert = require('assert')

const { launchDaemon, TestServer } = require('./test-server.js')
const { spawnPythonTestServer, mochaResolvePromise } = require('./helper.js')

const { WebSocketDaemon, SocketDaemon } = require('./../lib/daemon/daemon.js')
const { Proxy } = require('./../lib/proxy/proxy.js')

var pythonProcess = null
var daemons = []

before(async function () {
    var [data, process] = await spawnPythonTestServer()
    pythonProcess = process
    var socketDaemon = launchDaemon(
            new TestServer(),
            SocketDaemon,
            { host: 'localhost', port: 50002 },
            { objectId: 'TestServer' }
    )
    await socketDaemon.init()
    var wsSocketDaemon = launchDaemon(
            new TestServer(),
            WebSocketDaemon,
            { host: 'localhost', port: 50003 },
            { objectId: 'TestServer' }
    )
    await wsSocketDaemon.init()
    daemons.push(socketDaemon)
    daemons.push(wsSocketDaemon)
})

after(async function () {
    await new Promise((resolve, reject) => {
        pythonProcess.once('exit', resolve)
        pythonProcess.kill()
    }).then((code, signal) => {
        console.log(`process exited with code ${code}, signal ${signal}`)
    })
    daemons.forEach(async (daemon) => {
        await daemon.close()
    })
})

describe('Proxy integration', function () {
    var uris = [
        ['PYRO:TestServer@localhost:50001'], // Python test server
        ['PYRO:TestServer@localhost:50002'], // node test server
        ['PYRO_WS:TestServer@localhost:50003'] // node test ws server
    ]

    var objs = null

    beforeEach(function () {
        objs = uris.map((uri) => {
            return new Proxy(uri[0])
        })
    })

    after(async function () {
        objs.forEach(async (obj) => {
            await obj.end()
        })
    })

    describe('remoteHandShake', function () {
        it('proxy should be able to send and receive handshake message', function (done) {
            var p = objs.map((obj) => {
                obj.init().then(() => {
                    assert.strictEqual(('square' in obj), true)
                    obj.end()
                })
            })
            Promise.all(p).then(() => { done() }).catch((err) => { done(err) })
        })
    })

    describe('remoteMethod', function () {
        var echoStr = 'some string'
        it('proxy should be able to call remote methods', function (done) {
            var p = objs.map((obj) => {
                var p = obj.init().then(() => {
                    return obj.square([2])
                }).then((resp) => {
                    // console.debug(`${uris[idx]} square: ${resp}`)
                    assert.strictEqual(resp, 4)
                    return obj.square([4])
                }).then((resp) => {
                    // console.debug(`${uris[idx]} square: ${resp}`)
                    assert.strictEqual(resp, 16)
                    return obj.echo([echoStr])
                }).then((resp) => {
                    // console.debug(`${uris[idx]} echo: ${resp}`)
                    assert.strictEqual(resp, echoStr)
                    return obj.oneway_method([2])
                }).then((resp) => {
                    // console.debug(`${uris[idx]} oneway_method: ${resp}`)
                    assert.strictEqual(resp, null)
                    return obj.end()
                })
                return p
            })
            mochaResolvePromise(Promise.all(p), done)
        })
    })

    describe('remoteProperty', function () {
        it('proxy should be able to get remote properties', function (done) {
            var p = objs.map((obj, idx) => {
                var p = obj.init().then(() => {
                    return obj.name.get()
                }).then((name) => {
                    assert.strictEqual(
                        name === 'new name' || name === 'TestServer', true)
                    return obj.end()
                })
                return p
            })
            mochaResolvePromise(Promise.all(p), done)
        })
        it('should be able to set remote properties', function (done) {
            var p = objs.map((obj, idx) => {
                var newName = 'new name'
                var p = obj.init().then(() => {
                    return obj.name.set(newName)
                }).then(() => {
                    return obj.name.get()
                }).then((name) => {
                    assert.strictEqual(name, newName)
                    return obj.end()
                })
                return p
            })
            mochaResolvePromise(Promise.all(p), done)
        })
    })
})
