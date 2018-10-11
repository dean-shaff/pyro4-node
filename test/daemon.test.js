const assert = require("assert")

const { wait } = require("./../lib/util.js")
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
        it("should be able to register objects with Daemon", function(){
            var uri = daemon.register(server, {objectId: "BasicServer"})
            assert.strictEqual(uri.location, "localhost:50002")
            assert.strictEqual(uri.str, "PYRO:BasicServer@localhost:50002")
        })
    })
    describe("#init", function(){
        it("should be able to listen for incoming connections", async function(){
            await daemon.init()
            await wait(100).then(daemon.close())
        })
    })
    describe("#_invoke", function(){
        before(function(){
            daemon.register(server, {objectId: "BasicServer"})
        })
        it("should be able to invoke a method on a registered object", function(){
            daemon._invoke("BasicServer", "square", [2], {}, 0)
        })
        it("should raise DaemonError when method isn't present", function(){
            assert.throws(
                ()=>{daemon._invoke("BasicServer", "eww", [], {}, 0)}
            )
        })
        it("should raise DaemonError when object isn't present", function(){
            assert.throws(
                ()=>{daemon._invoke("SomeNonExistantServer", "square", [2], {}, 0)}
            )
        })
    })
    describe("#_handShake", function(){
        it("should be able to create a handshake Message", function(){
            daemon._handShake("Pyro.Daemon")
        })
    })
})
