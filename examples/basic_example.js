const remote = require("./../lib/proxy");

var dataHandler = (data)=>{
    console.log(data)
}

var proxyHandler = (proxy)=>{
    proxy.square({args:[2]}, dataHandler)
}

var main = function(){
    remote.locateNS(["localhost", 9090], (ns)=>{
        ns.lookup("BasicServer", proxyHandler)
    })
}

main()
