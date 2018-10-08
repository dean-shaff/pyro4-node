const { Proxy } = require("./../index.js")

var main = async ()=>{
    var p = new Proxy({objName: "BasicServer", port: 50001, host: "localhost"})
    await p.init()
    console.log(await p.square([2]))
    console.log(await p.name)
    await p.end()
}

main()
