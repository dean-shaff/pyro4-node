const { locateNS, SocketDaemon } = require("./../index.js")

const { BasicServer } = require("./basic-server.js")

var main = async ()=>{
    var server = new BasicServer()
    var daemon = new SocketDaemon({host: "localhost", port: 50002})
    var uri = daemon.register(server, {objectId:"BasicServer"})
    // with name server running:
    // await locateNS(async (ns)=>{
    //     var resp = await ns.register(["BasicServer", uri.str])
    //     console.log(resp)
    // })
    console.log(`Server's URI is ${uri.str}`)
    await daemon.init()
}

main()
