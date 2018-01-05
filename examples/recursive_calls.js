const remote = require("./../lib/proxy");

var proxyHandler = (proxy)=>{
    var iter = 0
    dataHandler = (data, proxy)=>{
        console.log(data)
        if (iter < 100){
            proxy.cube({args:[iter]}, dataHandler)
        }
        iter += 1
    }
    proxy.square({args:[2]},dataHandler)
}

var errorHandler = (error)=>{
    console.error(error.msg)
}

/**
 * Example using the address and object name of the server.
 */
var main = function(){
    var proxy = new remote.Proxy({port:50001, host:"localhost", objName:"BasicServer"})
    proxy.init(proxyHandler, errorHandler)
}

main()
