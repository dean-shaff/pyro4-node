const assert = require("assert")

const { Proxy, NameServerProxy, locateNS, withProxy, config } = require("./../index.js")

describe("Proxy", function(){
    config.logLevel.Proxy = "info"
    var connectMessageHeader = "PYRO\u00000\u0000\u0001\u0000\u0010\u0000\u0000" +
                               "\u0000\u0000\u0000,\u0000\u0002\u0000\u0000\u0000\u00005X"
    var uri = "PYRO:BasicServer@localhost:50001"
    var obj = null
    before(function(){
        obj = new Proxy(uri)
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
        it("should be able to get no args or kwargs", function(){
            options = obj._processOptions(null)
            assert.deepStrictEqual(options, {args: [], kwargs: {}})
        })
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


describe("NameServerProxy", function(){
    var ns = new NameServerProxy()
    describe("#list", function(){
        it("should be able to list objects on nameserver", async function(){
            await ns.init()
            var objs = await ns.list()
            assert.strictEqual(("BasicServer" in objs), true)
            await ns.end()
        })
    })

    describe("#lookup", function(){
        it("should be able to lookup some object on the nameserver", async function(){
            await ns.init()
            var details = await ns.lookup(["BasicServer"])
            assert.strictEqual(("state" in details), true)
            await ns.end()
        })
    })
})

describe("locateNS", function(){
    it("should be able to get the nameserver", async function(){
        await locateNS(async (ns)=>{
            assert.strictEqual(ns.constructor, NameServerProxy)
        })
    })
})

describe("withProxy", function(){
    var location = {port:50001, host:"localhost", objName:"BasicServer"}
    it("should release resources when done", async function(){
        await withProxy(location, async (proxy)=>{
            var res = await proxy.square([2])
            assert.strictEqual(res, 4)
        })
    })
})
