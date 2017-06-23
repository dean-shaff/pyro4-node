const Promise = require("promise")

const format = require('./../lib/format');
const logging = require('./../lib/logging');
const remote = require("./../lib/proxy");

logging.setLevel("INFO");

dataCallback = function(msg){
    console.log("main: Message data: {}".format(msg.data))
}

function main(){
    var p = new remote.NameServerProxy('localhost', 9090) ;
    var res = p.list(dataCallback) ;
    res.getResult();
    var res1 = p.lookup("BasicServer", dataCallback);
    res1.getResult();
}

main()
