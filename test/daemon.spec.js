const assert = require('assert')

require('./helper.js')
const { wait } = require('./../lib/util.js')
const { DaemonBase, SocketDaemon, WebSocketDaemon, expose } = require('./../lib/daemon/daemon.js')
const { TestServer } = require('./test-server.js')

describe('DaemonBase', function () {
    var server = null
    var daemon = null
    before(function () {
        server = new TestServer()
        daemon = new DaemonBase({ host: 'localhost', port: 50002 })
    })
    describe('register', function () {
        it('should be able to register objects with Daemon', function () {
            var uri = daemon.register(server, { objectId: 'TestServer' })
            assert.strictEqual(uri.location, 'localhost:50002')
            assert.strictEqual(uri.str, 'PYRO:TestServer@localhost:50002')
        })
    })

    describe('ping', function () {
        it('should return null', function () {
            assert.strictEqual(daemon.ping(), null)
        })
    })
    describe('info', function () {
        it('should return a string', function () {
            assert.strictEqual(daemon.info().constructor, String)
        })
    })
    describe('registered', function () {
        it('should return an array of object ids', function () {
            assert.strictEqual(daemon.registered().constructor, Array)
        })
    })
    describe('uriFor', function () {
        var compareUri
        before(function () {
            compareUri = daemon.register(server, { objectId: 'TestServer' })
        })
        it('should be able to a URI for a registered object, by name', function () {
            var uri = daemon.uriFor('TestServer')
            assert.strictEqual(compareUri.str, uri.str)
        })
        it('should be able to a URI for a registered object, by object', function () {
            var uri = daemon.uriFor(server)
            assert.strictEqual(compareUri.str, uri.str)
        })
    })

    describe('_invoke', function () {
        before(function () {
            daemon.register(server, { objectId: 'TestServer' })
        })
        it('should be able to invoke a method on a registered object', function () {
            daemon._invoke('TestServer', 'square', [2], {}, 0)
        })
        it('should be able to get attribute of registered object', function () {
            daemon._invoke('TestServer', '__getattr__', ['name'], {}, 0)
        })
        it('should be able to set attribute of registered object', function () {
            daemon._invoke('TestServer', '__setattr__', ['name', 'new name'], {}, 0)
            assert.strictEqual(server.name, 'new name')
        })
        it('should raise DaemonError when method isn\'t present', function () {
            assert.throws(
                () => { daemon._invoke('TestServer', 'eww', [], {}, 0) }
            )
        })
        it('should raise DaemonError when object isn\'t present', function () {
            assert.throws(
                () => { daemon._invoke('SomeNonExistantServer', 'square', [2], {}, 0) }
            )
        })
    })
})

describe('expose', function () {
    class DummyClass {
        constructor () { this._name = null }
        method () {}
        get name () { return this._name }
        set name (value) { this._name = value }
    }
    it('should be able to expose functions', function () {
        expose(DummyClass.prototype.method)
        assert.strictEqual(
            ('_pyroExposed' in DummyClass.prototype.method), true
        )
    })
    it('should be able to expose attributes by passing property descriptor', function () {
        var propDescriptor = Object.getOwnPropertyDescriptor(
            DummyClass.prototype, 'name')
        expose(propDescriptor)
        assert.strictEqual(
            ('_pyroExposed' in propDescriptor.get), true
        )
    })
    it('should be able to expose attributes by passing class and property descriptor name', function () {
        expose(DummyClass, 'name')
        var propDescriptor = Object.getOwnPropertyDescriptor(
            DummyClass.prototype, 'name')
        assert.strictEqual(
            ('_pyroExposed' in propDescriptor.get), true
        )
    })
})
