const Promise = require("promise")

const remote = require("./../lib/proxy");
const logging = require('./../lib/logging');

logging.setLevel("INFO");

dataCallback = function(msg){
    console.log("main: Message data: {}".format(msg.data))
}

function main(){
    // var p = new remote.Proxy('localhost', 9090, "Pyro.NameServer");
    // console.log(p)
    // var res = p.callMethod('list', null, null, dataCallback);
    // res.getResult();
    // var res1 = p.callMethod('lookup', ["BasicServer"], null, dataCallback);
    // res1.getResult();
    var p = new remote.NameServerProxy('localhost', 9090) ;
    var res = p.list(dataCallback) ;
    res.getResult();
    var res1 = p.lookup("BasicServer", dataCallback);
    res1.getResult();
}

main()
