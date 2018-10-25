const { locateNS, expose, Daemon, NameServerDaemon } = require("./../index.js")

class BasicServer{
    constructor(){
        this._name = "BasicServer"
    }

    get name(){
        return this._name
    }

    set name(value){
        this._name = value
    }

    square(x){
        return x**2
    }

    echo(val){
        return val
    }

    ping(){}
}

expose(BasicServer.prototype.echo)
expose(BasicServer.prototype.square)
expose(BasicServer, "name")

var main = async ()=>{
    var server = new BasicServer()
    var daemon = new Daemon({host: "localhost", port: 50002})
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
