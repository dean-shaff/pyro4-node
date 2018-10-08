const { withProxy } = require("./../index.js")

var main = async ()=>{
    var uri = "Pyro:BasicServer@localhost:50001"
    await withProxy(uri, async (proxy)=>{
        console.log(await proxy.square([2]))
        console.log(await proxy.name)
        console.log(await proxy.echo(["hey there"]))
    })
}

main()
