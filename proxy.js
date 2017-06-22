const net = require('net');

const message = require('./message');
const format = require('./format');
const logging = require('./logging');

var RemoteMethodCall = function(){
    if (!(this instanceof RemoteMethodCall)){
      return new RemoteMethodCall(arguments);
    }
    this.writeCallback = arguments[0] ;
    this.consumeCallback = arguments[1] ;
    this.methodName = arguments[2]
    this.args = arguments[3];
    this.kwargs = arguments[4];
    // console.log(this.methodName, this.args, this.kwargs);
}
RemoteMethodCall.prototype.getData = function(){

    var msg = this.writeCallback(this.methodName, this.args, this.kwargs);
    // console.log(msg);
    return msg.toBytes();
}

RemoteMethodCall.prototype.processData = function(msg){
    this.consumeCallback(msg);
}

var Proxy = function(host, port, objectName){
    this.host = host ;
    this.port = port ;
    this.objectName = objectName ;
    this.client = null ;
    this.logger = new logging.Logger("Proxy");
    this.initialized = false ;
    this.remoteCalls = [];
    this.waitingForResponse = false;
}

Proxy.prototype.init = function(cb){
    this.createInitClientConnection();
    this.client.on('end', ()=>{
        this.initialized = true;
        var callbacks = cb();
        this.invokeRemoteCalls(callbacks)
    })
}

Proxy.prototype.createInitClientConnection = function(){
    var remoteCall = new RemoteMethodCall(this.handshake(this), this.setMethods(this));
    this.remoteCalls.push(remoteCall);
    var client = net.createConnection({port:this.port}, ()=>{
        client.write(remoteCall.getData());
    })
    client.on('data', this.dataCallback(this));
    client.on('error', this.errorCallback(this));
    client.on('drain', this.drainCallback(this));
    this.client = client ;
}

Proxy.prototype.invokeRemoteCalls = function(callbacks){
    if (! this.initialized){
        return false;
    }
    var self = this;
    var _createClient = function(){
        var remoteHandshake = new RemoteMethodCall(self.handshake(self), self.setMethods(self));
        self.remoteCalls.push(remoteHandshake)
        callbacks.forEach((cb)=>{
            self.remoteCalls.push(cb)
        })
        var client = net.createConnection({port: self.port}, () => {
            self.remoteCalls.forEach((cb)=>{
                client.write(cb.getData());
            })
        });
        client.on('data', self.dataCallback(self));
        client.on('end', self.endCallback(self));
        client.on('error', self.errorCallback(self));
        client.on('drain', self.drainCallback(self));
        return client ;
    }
    console.log("Creating fresh client.");
    if (this.client == null){
        this.client = _createClient();
    } else {
        this.client.destroy();
        this.client = _createClient()
    }
}
Proxy.prototype.handshake = function(self) {
    console.log("handshake: Called");
    return function(){
        var dataConnect = {
            "handshake": "hello",
            "object": self.objectName
        };
        var dataConnectJSON = JSON.stringify(dataConnect);
        var msgConnect = new message.Message(message.MSG_CONNECT,
                        dataConnectJSON, message.FLAGS_META_ON_CONNECT, 0);
        return msgConnect ;
    }
}

Proxy.prototype.callMethod = function(methodName, args, kwargs){
    console.log("call: Calling {}".format(methodName))
    var self = this;
    var invokeCallback = function(){
        if (kwargs == null){
            kwargs = {};
        }
        if (args == null){
            args = [];
        }
        var dataCall = {
            "object": 'BasicServer',
            "params": args,
            "method": methodName,
            "kwargs": kwargs,
        }
        var dataCallJSON = JSON.stringify(dataCall);
        console.log("callMethod: dataCallJSON: {}".format(dataCallJSON));
        // self.logger.debug("call: dataCallJSON: {}".format(dataCallJSON))
        var msgCall = new message.Message(message.MSG_INVOKE, dataCallJSON, 0, 0);
        return msgCall;
    }
    return invokeCallback();
}

Proxy.prototype.setMethods = function(self){
    console.log("setMethods external: Called.")
    return function(msg){
        var msgData = JSON.parse(msg.data)
        console.log("setMethods internal: Called.")
        console.log("setMethods internal: msg: {}".format(msgData))
        if ("handshake" in msgData){
            var methods = msgData.meta.methods;
            methods.forEach((method)=>{
                Proxy.prototype[method] = function(args, kwargs, resultCallback){
                    return new RemoteMethodCall(self.callMethod, resultCallback, method, args, kwargs)
                    // return self.callMethod(method, args, kwargs, resultCallbacks);
                };
            });
        }
    }
}

Proxy.prototype.dataCallback = function(self){
    return function(data){
        self.logger.debug("dataCallback: Called. data size: {}".format(data.length));
        var msgs = message.Message.recv(data);
        msgs.forEach((msg)=>{
            var remoteCall = self.remoteCalls.shift();
            remoteCall.processData(msg);
        })
        self.client.end();
    }
};

Proxy.prototype.endCallback = function(self){
    return function(){
        self.logger.info("Connection closed.");
    }
};

Proxy.prototype.errorCallback = function(self){
    return function(error){
        self.logger.error(`Error: ${error.code}`);
    }
}

Proxy.prototype.drainCallback = function(self){
    return function(){
        self.logger.debug("drainCallback: Called.");
    }
}

Proxy.createProxy = function(host, port, objectName, cb){
    var proxy = new Proxy(host, port, objectName);
    proxy.init(cb);
    return proxy;
}

exports.Proxy = Proxy ;
exports.RemoteMethodCall = RemoteMethodCall;
// exports. = Proxy ;

//
//
// const client = net.createConnection({ port: 50001 }, () => {
//     var data = {"handshake": "hello", "object": "BasicServer"};
//     var dataSqr = {"object": "BasicServer", "params": [100], "method": "square", "kwargs": {}}
//     var dataJSON = JSON.stringify(data);
//     var dataSqrJSON = JSON.stringify(dataSqr);
//     console.log(dataJSON);
//     msg = new message.Message(message.MSG_CONNECT, dataJSON, message.FLAGS_META_ON_CONNECT, 0);
//     msgSqr = new message.Message(message.MSG_INVOKE,dataSqrJSON, 0, 0);
//     var writeResp1 = client.write(msg.toBytes());
//     var writeResp2 = client.write(msgSqr.toBytes());
//     console.log("Response: {}, {}".format(writeResp1, writeResp2))
// });
//
// client.on('data', (data) => {
//     var msgs = message.Message.recv(data);
// })
//
// client.on('drain', () => {
//     console.log("Drained.")
// })
//
// client.on('end', () => {
//     console.log('Disconnected from server');
// });
