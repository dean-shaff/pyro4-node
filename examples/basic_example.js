const remote = require("./../lib/proxy")
const logging = require('./../lib/logging');

logging.setLevel("INFO");

dataCallback = function(msg){
    console.log("main: Message data: {}".format(msg.data))
}

function method1(){
    var p = new remote.Proxy('localhost', 50001, 'BasicServer');
    p.init(() => {
        return [p.callMethod('square',[2],null, dataCallback),
                p.callMethod('cube', [3],null, dataCallback)]
    });
}

function method2(){
    var p = new remote.Proxy('localhost', 50001, 'BasicServer');
    var res = p.callMethod('square', [2], null, dataCallback)
    res.getResult()
    var res1 = p.callMethod('cube', [100], null, dataCallback)
    res1.getResult()
}

method2()
