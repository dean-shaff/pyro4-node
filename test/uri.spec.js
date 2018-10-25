const assert = require("assert")

const { URI } = require("./../lib/uri.js")

describe("URI", function(){
    var uriString = "PYRO:TestServer@localhost:50001"
    var state = {
        protocol: "PYRO",
        object: "TestServer",
        host: "localhost",
        port: 50001
    }
    describe("#_parseStringURI", function(){
        it("should be able to parse normal Daemon URI", function(){
            var uri = new URI(uriString)
            assert.deepStrictEqual(uri.state, state)
        })
    })
    describe("#location", function(){
        it("should be able to get location", function(){
            var uri = new URI(uriString)
            assert.strictEqual(uri.location, "localhost:50001")
        })
    })
})
