const { expose } = require("./../lib/daemon.js")

class TestServer{
    constructor(){
        this._name = "TestServer"
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

    ping(){}
}

expose(TestServer.prototype.square)
expose(TestServer.prototype.ping)
expose(TestServer, "name")

exports.TestServer = TestServer
