const assert = require("assert")

const { Daemon } = require("./../lib/daemon.js")
const { BasicServer } = require("./basic-server.js")


describe("Daemon", function(){
    var server = null
    var daemon = null
    before(function(){
        server = new BasicServer()
        daemon = new Daemon({host: "localhost", port: 50002})
    })
    describe("#register", function(){
        it("should be able to register objects with Daemon", async function(){
            var uri = await daemon.register(server, {objectId: "BasicServer"})
            assert.strictEqual(uri.location, "localhost:50002")
            assert.strictEqual(uri.str, "PYRO:BasicServer@localhost:50002")
        })
    })
    
})
