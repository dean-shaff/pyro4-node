const { expose } = require("./../lib/daemon/daemon.js")

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

exports.BasicServer = BasicServer
