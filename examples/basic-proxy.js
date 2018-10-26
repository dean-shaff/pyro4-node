const { Proxy } = require("./../index.js")

var main = async ()=>{
    var p = new Proxy("Pyro:TestServer@localhost:50001")
    await p.init()
    var promises = []
    for (let i=0; i<5; i++){
        promises.push(
            p.square([i])
        )
    }
    var resp = await Promise.all(promises)
    console.log(resp)
    console.log(await p.square([2]))
    console.log(await p.name.get())
    await p.end()
}

main()
