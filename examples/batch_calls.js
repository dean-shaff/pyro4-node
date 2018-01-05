const remote = require("./../lib/proxy");

var proxyHandler = (proxy)=>{
    var dataHandler = (data, proxy)=>{
        console.log(data)
    }
    var calls = []
    for (var i=0; i<100; i++){
        calls.push({methodName: "square", options:{args:[i]}, handler: dataHandler, errorHandler: errorHandler})
    }
    proxy.batch(calls)
}

var errorHandler = (error)=>{
    console.error(error.msg)
}

/**
 * Example using the address and object name of the server.
 */
var main = function(){
    remote.locateNS({port:9090, host:"localhost"},(ns)=>{
        ns.lookup("BasicServer", proxyHandler, errorHandler)
    })
}

main()
