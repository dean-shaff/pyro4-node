const remote = require("./proxy")
const logging = require('./logging');
const sleep = require("sleep")
// const Service = require("./service_example")

logging.setLevel("DEBUG");

dataCallback = function(msg){
    console.log("main: Message data: {}".format(msg.data))
}
var p = new remote.Proxy('localhost', 50001, 'BasicServer');
// p.init(() => {
//     return [new remote.RemoteMethodCall(p.callMethod, dataCallback,'square',[2],null),
//             new remote.RemoteMethodCall(p.callMethod, dataCallback,'square',[2],null),
//             new remote.RemoteMethodCall(p.callMethod, dataCallback,'square',[2],null),
//             new remote.RemoteMethodCall(p.callMethod, dataCallback,'square',[2],null),
//             new remote.RemoteMethodCall(p.callMethod, dataCallback,'square',[2],null),]
// });
p.init(() => {
    console.log(p.host);
    return [p.square([2],null, dataCallback),
            p.square([2],null, dataCallback),
            p.square([2],null, dataCallback),
            p.square([2],null, dataCallback),
            p.square([2],null, dataCallback),]
});
    // console.log(p.client)
    // p.client.on('data', function(data){
    //     console.log(data.length);
    // })
    // console.log(p.client.write("Hey"));
    // console.log("Value of newly created method: {}".format(p.square()));

// var p1 = Proxy.createProxy('localhost', 50001, 'BasicServer', function(){
//     console.log(this.host);
// });

// var p = proxy.createProxy('lo')

// const p = new proxy.Proxy('localhost', 50001, 'BasicServer', () =>{
//     console.log(this.host) ;
// })

// var p = new proxy.Proxy('localhost', 50001, 'BasicServer')
    // p.call('square', [2], null, (result) => {
    //     console.log(result)
    // })
    // p.call('square', [2], null, (result) => {
    //     console.log(result)
    // })
    // p.execute();
// });
//
//
//
// p.execute() ;

// p.call('square',[2], null, (msgs) => {
//     msgs.forEach((msg) => {
//         console.log(msg.data);
//     })
// });
