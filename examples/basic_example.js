const Promise = require("promise")

const remote = require("./../lib/proxy");
const logging = require('./../lib/logging');

logging.setLevel("INFO");

dataCallback = function(msg){
    console.log("main: Message data: {}".format(msg.data))
}

function main(){
    var p = new remote.Proxy('localhost', 50001, 'BasicServer');
    // this is the prefered way to work with remote calls.
    p.invokeRemoteCalls(()=>{
            var calls = []
            for (var i=0; i< 100; i++){
                calls.push(p.callMethod('square',[i], dataCallback))
                calls.push(p.callMethod('cube', [i], dataCallback))
            }
            return calls ;
        }
    )
    // Note that making multiple calls in a row might get mixed up.
    // We can't, for example, do the following:
    // for (var i=0; i<100; i++){
    //      var res = p.callMethod("square", [i], dataCallback);
    //      res.getResult();
    //}
    // For one off calls, you can do the following:
    var res = p.callMethod("square",[100],dataCallback)
    res.getResult()

}


main();
