const assert = require('assert')

const { URI } = require('./../lib/uri.js')

describe('URI', function () {
    var uriString = 'PYRO:TestServer@localhost:50001'
    var wsUriString = 'PYRO_WS:TestServer@localhost:50002'
    var state = {
        protocol: 'PYRO',
        object: 'TestServer',
        host: 'localhost',
        port: 50001,
        sockname: null
    }
    var wsState = {
        protocol: 'PYRO_WS',
        object: 'TestServer',
        host: 'localhost',
        port: 50002,
        sockname: null
    }

    describe('#_parseStringURI', function () {
        it('should be able to parse normal Socket URI', function () {
            var uri = new URI(uriString)
            assert.deepStrictEqual(uri.state, state)
        })
        it('should be able to parse WebSocket URI', function () {
            var uri = new URI(wsUriString)
            assert.deepStrictEqual(uri.state, wsState)
        })
    })
    describe('#location', function () {
        it('should be able to get location', function () {
            var uri = new URI(uriString)
            assert.strictEqual(uri.location, 'localhost:50001')
        })
    })
    describe('#toObj', function () {})
    describe('#fromObj', function () {})
})
