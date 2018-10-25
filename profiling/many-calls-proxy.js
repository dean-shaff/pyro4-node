const { Proxy, locateNS } = require("./../index.js")

var nCalls = 100

var main = async ()=>{

    var uri
    await locateNS(async (ns)=>{
        uri = await ns.lookup(["TestServer"])
        console.log(uri)
    })
    var uri = "PYRO:TestServer@localhost:50001"
    var p = new Proxy(uri)
    await p.init()
    console.time("calls")
    for (var i = 0; i < nCalls; i++){
        console.time("call")
        await p.square([2])
        console.timeEnd("call")
    }
    console.timeEnd("calls")
    await p.end()
}

main()
