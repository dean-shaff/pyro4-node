const { withProxy } = require("./../index.js")

var main = async ()=>{
    var location = {
        port: 50001,
        host: "localhost",
        objName: "BasicServer"
    }
    await withProxy(location, async (proxy)=>{
        console.log(await proxy.square([2]))
        console.log(await proxy.name)
        console.log(await proxy.echo(["hey there"]))
    })
}

main()
