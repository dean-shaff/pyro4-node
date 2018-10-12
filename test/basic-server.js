const { expose } = require("./../lib/daemon.js")

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

exports.BasicServer = BasicServer
