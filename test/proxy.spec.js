const assert = require('assert')

const { ProxyBase } = require('./../lib/proxy/proxy-base.js')
const { SocketProxy } = require('./../lib/proxy/socket-proxy.js')
const { WebSocketProxy } = require('./../lib/proxy/web-socket-proxy.js')
const { Proxy } = require('./../lib/proxy/proxy.js')

describe('Proxy', function () {
    it('should be able to pick SocketProxy class', function () {
        var uri = 'PYRO:TestServer@localhost:50001'
        var proxy = new Proxy(uri)
        assert.strictEqual(proxy._proxyName, 'SocketProxy')
    })
    it('should be able to pick WebSocketProxy class', function () {
        var uri = 'PYRO_WS:TestServer@localhost:50001'
        var proxy = new Proxy(uri)
        assert.strictEqual(proxy._proxyName, 'WebSocketProxy')
    })
})

describe('ProxyBase', function () {
    var connectMessageHeader = Buffer.from(
        'PYRO\u00000\u0000\u0001\u0000\u0010\u0000\u0000\u0000\u0000\u0000+' +
        '\u0000\u0002\u0000\u0000\u0000\u00005W'
    )
    var uri = 'PYRO:TestServer@localhost:50001'
    var obj = null

    before(async function () {
        obj = new ProxyBase(uri)
    })

    describe('#_processOptions', function () {
        it('should be able to get no args or kwargs', function () {
            options = obj._processOptions(null)
            assert.deepStrictEqual(options, { args: [], kwargs: {} })
        })
        it('should be able to get args', function () {
            options = obj._processOptions(['arg'])
            assert.deepStrictEqual(options, { args: ['arg'], kwargs: {} })
        })
        it('should be able to get kwargs', function () {
            options = obj._processOptions({ kwarg: 'kwarg' })
            assert.deepStrictEqual(options, { args: [], kwargs: { kwarg: 'kwarg' } })
        })
        it('should be able to process mix of args and kwargs', function () {
            options = obj._processOptions(['arg'], { kwarg: 'kwarg' })
            assert.deepStrictEqual(options, { args: ['arg'], kwargs: { kwarg: 'kwarg' } })
        })
    })

    describe('#_remoteHandShakeMessage', function () {
        it('should be able to generate handshake message bytes', async function () {
            var bytes = Buffer.from(await obj._remoteHandShakeMessage().toBytes())
            var connectMessageBytesTrue = Buffer.concat([
                connectMessageHeader,
                Buffer.from('{"handshake":"hello","object":"TestServer"}')
            ])
            assert.strictEqual(
                bytes.equals(connectMessageBytesTrue), true
            )
        })
    })
    describe('#ProxyBase.with', function () {
        it('should be able to release resources when done', async function () {
            ProxyBase.with({}, async () => {})
        })
    })

    describe('#ProxyBase.locateNS', function () {
        it('should be able to get the nameserver', async function () {
            await ProxyBase.locateNS(async (ns) => {
                assert.notStrictEqual(ns, null)
            })
        })
    })
})
