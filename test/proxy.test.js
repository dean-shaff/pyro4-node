const assert = require("assert")

const proxy = require("./../lib/proxy.js")

describe("Proxy", function(){
    var connectMessageHeader = "PYRO\u00000\u0000\u0001\u0000\u0010\u0000\u0000" +
                               "\u0000\u0000\u0000,\u0000\u0002\u0000\u0000\u0000\u00005X"
    var location = {port:50001, host:"localhost", objName:"BasicServer"}
    var obj = null
    before(function(){
        obj = new proxy.Proxy(location)
    })

    describe("#init", function(){
        it("should be able to send and receive handshake message", async function(){
            await obj.init()
            assert.strictEqual(("square" in obj), true)
            await obj.end()
        })
    })

    describe("remoteMethod", function(){
        it("should be able to call remote methods", async function(){
            await obj.init()
            var resp = await obj.square({args:[2], kwargs:{}})
            assert.strictEqual(resp, 4)
            await obj.end()
        })
    })

    describe("remoteProperty", function(){
        it("should be able to acces remote properties", async function(){
            await obj.init()
            var resp = await obj.name.get()
        })
    })


    describe("_remoteHandShake", function(){
        it("should be able to generate handshake message bytes", async function(){
            var bytes = await obj._remoteHandShakeMessage()
            assert.equal(
                bytes,
                `${connectMessageHeader}{"handshake":"hello","object":"BasicServer"}`
            )
        })
    })
})
