const assert = require("assert")

require("./helper.js")
const { wait } = require("./../lib/util.js")
const { Daemon } = require("./../lib/daemon.js")
const { NameServer, NameServerDaemon, startNs } = require("./../lib/naming.js")

const { BasicServer } = require("./basic-server.js")


describe("NameServer", function(){
    var ns
    before(function(){
        ns = new NameServer()
    })

    describe("register", function(){
        var basicServerObj = new BasicServer()
        var basicServerDaemon = new Daemon("localhost", 50001)
        var basicServerURI = basicServerDaemon.register(basicServerObj)
        var basicServerName = "BasicServer"

        before(function(){
            ns.register(basicServerName, basicServerURI)
        })
        describe("count", function(){
            it("should be able to count number of objects on server", function(){
                var count = ns.count()
                assert.strictEqual(count, 1)
            })
        })
        describe("lookup", function(){
            it("should be able to lookup an object on the nameserver", function(){
                var uri = ns.lookup(basicServerName)
                assert.strictEqual(uri, basicServerURI)
            })
        })
        describe("set_metadata", function(){

        })
        describe("remove", function(){
            it("should be able to remove a registered object from the nameserver", function(){
                ns.remove(basicServerName)
            })
            it("should be able to recognize when attempting to remove an object that isn't registered", function(){
                ns.remove("SomethingElse")
            })
        })
        describe("list", function(){
            it("should be able to list objects on the nameserver", function(){
                var objList = ns.list()
            })
        })
    })

    describe("ping", function(){
        it("should be able to call dummy ping method", function(){
            assert.strictEqual(ns.ping(), null)
        })
    })
})

describe("NameServerDaemon", function(){
    it("should be able to start and stop name server daemon", async function(){
        var nsDaemon = new NameServerDaemon("localhost", 9091)
        await nsDaemon.init()
        await wait(100).then(nsDaemon.close())
    })
})

describe("startNs", function(){
    it("should be able to call startNs function", async function(){
        await startNs("localhost", 9091).then(async (ns)=>{
            assert.strictEqual(ns.constructor, NameServerDaemon)
            await wait(100).then(ns.close())
         })
    })
})
