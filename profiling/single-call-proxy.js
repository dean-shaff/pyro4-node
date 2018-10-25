const { performance, PerformanceObserver } = require("perf_hooks")

const { Proxy, locateNS, URI, config } = require("./../index.js")

var nCalls = 100
config.logLevel.Proxy = "error"


var main = async ()=>{
    ns = new Proxy("PYRO:Pyro.NameServer@localhost:9090")
    await ns.init()
    console.time("lookup")
    var uri = await ns.lookup(["TestServer"])
    console.timeEnd("lookup")
    await ns.end()
    uri = new URI(uri.state)
    var p = new Proxy(uri)
    await p.init()
    console.time("square")
    await p.square([2])
    console.timeEnd("square")
    await p.end()
}

main()
