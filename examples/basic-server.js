const { expose, Daemon } = require("./../index.js")

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
}

expose(BasicServer.prototype.square)
expose(BasicServer, "name")
// expose(Object.getOwnPropertyDescriptor(BasicServer.prototype, "name"))

var main = async ()=>{
    var server = new BasicServer()
    var daemon = new Daemon({host: "localhost", port: 50002})
    var uri = daemon.register(server, {objectId:"BasicServer"})
    console.log(`Server's URI is ${uri.str}`)
    await daemon.init()
}

main()
