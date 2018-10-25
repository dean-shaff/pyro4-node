const assert = require("assert")

require("./helper.js")
const { wait } = require("./../lib/util.js")
const { Daemon } = require("./../lib/daemon.js")
const { TestServer } = require("./test-server.js")
const { Proxy } = require("./../lib/proxy.js")


describe("Daemon Integration", function(){
    var server ;
    var daemon ;
    var uri ;

    before(function(){
        server = new TestServer()
        daemon = new Daemon({host: "localhost", port: 50002})
        uri = daemon.register(server, {objectId: "TestServer"})
        console.log(uri.str)
    })

    it("should be able to connect to Daemon", async function(){
        await daemon.init()
        await Proxy.with(uri, async (proxy)=>{
            var resp = await proxy.square([2])
            Daemon.logger.info(`got ${resp} back from server`)
        })
        await daemon.close()
    })

})
