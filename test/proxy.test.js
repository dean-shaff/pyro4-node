const assert = require("assert")

const { Proxy, config } = require("./../index.js")

describe("Proxy", function(){
    config.logLevel.Proxy = "debug"
    var connectMessageHeader = "PYRO\u00000\u0000\u0001\u0000\u0010\u0000\u0000" +
                               "\u0000\u0000\u0000,\u0000\u0002\u0000\u0000\u0000\u00005X"
    var location = {port:50001, host:"localhost", objName:"BasicServer"}
    var obj = null
    before(function(){
        obj = new Proxy(location)
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
            var resp = await obj.square([2])
            assert.strictEqual(resp, 4)
            await obj.end()
        })
    })

    describe("remoteProperty", function(){
        it("should be able to get remote properties", async function(){
            await obj.init()
            var name = await obj.name
            assert.strictEqual(
                name === "new name" || name === "BasicServer", true)
            await obj.end()
        })
        it("should be able to set remote properties", async function(){
            var newName = "new name"
            await obj.init()
            await (obj.name = newName)
            var name = await obj.name
            assert.strictEqual(name, newName)
            await obj.end()
        })
    })

    describe("#_processOptions", function(){
        it("should be able to get args", function(){
            options = obj._processOptions(["arg"])
            assert.deepStrictEqual(options, {args: ["arg"], kwargs: {}})
        })
        it("should be able to get kwargs", function(){
            options = obj._processOptions({kwarg:"kwarg"})
            assert.deepStrictEqual(options, {args: [], kwargs: {kwarg: "kwarg"}})
        })
        it("should be able to process mix of args and kwargs", function(){
            options = obj._processOptions(["arg"], {kwarg:"kwarg"})
            assert.deepStrictEqual(options, {args: ["arg"], kwargs: {kwarg: "kwarg"}})
        })
    })

    describe("#_remoteHandShakeMessage", function(){
        it("should be able to generate handshake message bytes", async function(){
            var bytes = await obj._remoteHandShakeMessage()
            assert.equal(
                bytes,
                `${connectMessageHeader}{"handshake":"hello","object":"BasicServer"}`
            )
        })
    })
})
