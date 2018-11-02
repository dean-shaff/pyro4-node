const assert = require('assert')

require('./helper.js')
const { wait } = require('./../lib/util.js')
const { SocketDaemon } = require('./../lib/daemon/daemon.js')
const { NameServer, NameServerDaemon, startNs } = require('./../lib/naming.js')

const { TestServer } = require('./test-server.js')

describe('NameServer', function () {
    var ns
    before(function () {
        ns = new NameServer()
    })

    describe('register', function () {
        var testServerObj = new TestServer()
        var testServerDaemon = new SocketDaemon('localhost', 50001)
        var testServerURI = testServerDaemon.register(testServerObj)
        var testServerName = 'TestServer'

        before(function () {
            ns.register(testServerName, testServerURI)
        })
        describe('count', function () {
            it('should be able to count number of objects on server', function () {
                var count = ns.count()
                assert.strictEqual(count, 1)
            })
        })
        describe('lookup', function () {
            it('should be able to lookup an object on the nameserver', function () {
                var uri = ns.lookup(testServerName)
                assert.strictEqual(uri, testServerURI)
            })
        })
        describe('set_metadata', function () {

        })
        describe('remove', function () {
            it('should be able to remove a registered object from the nameserver', function () {
                ns.remove(testServerName)
            })
            it("should be able to recognize when attempting to remove an object that isn't registered", function () {
                ns.remove('SomethingElse')
            })
        })
        describe('list', function () {
            it('should be able to list objects on the nameserver', function () {
                var objList = ns.list()
            })
        })
    })

    describe('ping', function () {
        it('should be able to call dummy ping method', function () {
            assert.strictEqual(ns.ping(), null)
        })
    })
})

describe('NameServerDaemon', function () {
    it('should be able to start and stop name server daemon', async function () {
        var nsDaemon = new NameServerDaemon('localhost', 9091)
        await nsDaemon.init()
        await wait(100).then(nsDaemon.close())
    })
})

describe('startNs', function () {
    it('should be able to call startNs function', async function () {
        await startNs('localhost', 9091).then(async (ns) => {
            assert.strictEqual(ns.constructor, NameServerDaemon)
            await wait(100).then(ns.close())
         })
    })
})
