const { Proxy } = require("./../index.js")

var main = async ()=>{
    var p = new Proxy("Pyro:BasicServer@localhost:50001")
    await p.init()
    console.log(await p.square([2]))
    console.log(await p.name)
    await p.end()
}

main()
