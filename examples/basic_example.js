const Promise = require("promise")

const remote = require("./../lib/proxy");
const logging = require('./../lib/logging');

logging.setLevel("DEBUG");

dataCallback = function(msg){
    console.log("main: Message data: {}".format(msg.data))
}

function main(){
    var p = new remote.Proxy('localhost', 50001, 'BasicServer');
    var res = p.callMethod('square', [2], dataCallback);
    res.getResult();
    var res1 = p.callMethod('cube', [100], dataCallback);
    res1.getResult();
}

main();
