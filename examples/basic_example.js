const remote = require("./../lib/proxy");

var dataHandler = (data, proxy)=>{
    console.log(data)
}

var proxyHandler = (proxy)=>{
    proxy.square({args:[2]}, dataHandler)
}

var errorHandler = (error)=>{
    console.error(error.msg)
}

/**
 * Example using the "locateNS" funnction. This allows
 * you to find any object registered on the nameserver
 */
var main_locateNS = function(){
    remote.locateNS(["localhost", 9090], (ns)=>{
        ns.lookup("BasicServer", proxyHandler)
    })
}

/**
 * Example using the address and object name of the server.
 */
var main_directAddress = function(){
    var proxy = new remote.Proxy({port:50001, host:"localhost", objName:"BasicServer"})
    proxy.init(proxyHandler, errorHandler)
}

main_locateNS()
main_directAddress()
