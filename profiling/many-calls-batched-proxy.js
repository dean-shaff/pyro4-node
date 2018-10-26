const { Proxy, locateNS } = require("./../index.js")

var nCalls = 100

var main = async ()=>{
    var uri
    await locateNS(async (ns)=>{
        uri = await ns.lookup(["TestServer"])
    })
    var uri = "PYRO:TestServer@localhost:50001"
    var p = new Proxy(uri)
    await p.init()
    var calls = []
    for (var i = 0; i < nCalls; i++){
        calls.push(p.square([2]))
    }
    console.time("calls")
    var resp = await Promise.all(calls)
    console.timeEnd("calls")
    await p.end()
}

main()
