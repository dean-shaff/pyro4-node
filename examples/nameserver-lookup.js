const { locateNS } = require("./../index.js")

var main = async ()=>{
    await locateNS(async (ns)=>{
        console.log(await ns.list())
        console.log(await ns.lookup(["Pyro.NameServer"]))
    })
}

main()
