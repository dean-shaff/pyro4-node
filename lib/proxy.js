const net = require('net');
const format = require('py-format');

const message = require('./message');
const logging = require('./logging');

const NAMESERVER_NAME = "Pyro.NameServer"

var RemoteMethodCall = function(){
    if (!(this instanceof RemoteMethodCall)){
      return new RemoteMethodCall(arguments);
    }
    this.parent = arguments[0] ;
    this.writeCallback = arguments[1] ;
    this.consumeCallback = arguments[2] ;
}

RemoteMethodCall.prototype.getData = function(){
    var msg = this.writeCallback() ; //this.methodName, this.args, this.kwargs);
    return msg.toBytes();
}

RemoteMethodCall.prototype.processData = function(msg){
    this.consumeCallback(msg);
}

RemoteMethodCall.prototype.getResult = function(){
    this.parent.invokeRemoteCalls([this]);
}


var Proxy = function(host, port, objectName){
    if (!(this instanceof Proxy)){
      return new Proxy(arguments);
    }
    this.host = host ;
    this.port = port ;
    this.objectName = objectName ;
    this.client = null ;
    this.logger = new logging.Logger("Proxy");
    this.remoteCalls = [];
}

Proxy.prototype.init = function(cb){
    this.createInitClientConnection();
    this.client.on('end', ()=>{
        var callbacks = cb();
        this.invokeRemoteCalls(callbacks)
    })
}

Proxy.prototype.createInitClientConnection = function(){
    var remoteHandshake = new RemoteMethodCall(this, this.writeHandshake(this),
                                          this.consumeHandshake(this));
    this.remoteCalls.push(remoteHandshake);
    var client = net.createConnection({port:this.port}, ()=>{
        client.setKeepAlive(true);
        client.write(this.remoteCalls[this.remoteCalls.length - 1].getData());
    })
    client.on('data', this.dataCallback(this));
    client.on('error', this.errorCallback(this));
    client.on('drain', this.drainCallback(this));
    this.client = client ;
}

Proxy.prototype.invokeRemoteCalls = function(callbacks){
    if (callbacks.constructor == Function){
        callbacks = callbacks();
    }
    var self = this;
    var _createClient = function(){
        var remoteHandshake = new RemoteMethodCall(self, self.writeHandshake(self),
                                              self.consumeHandshake(self));
        self.remoteCalls.push(remoteHandshake)
        callbacks.forEach((cb)=>{
            self.remoteCalls.push(cb)
        })
        var client = net.createConnection({port: self.port}, () => {
            client.setKeepAlive(true);
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
    this.logger.debug("Creating fresh client.");
    if (this.client == null){
        this.client = _createClient();
    } else {
        this.client.removeAllListeners('end');
        this.client.on('end', () => {
            this.client.destroy()
            this.client = _createClient()
        })
    }
}
Proxy.prototype.writeHandshake = function(self) {
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

Proxy.prototype.callMethod = function(){
    var self = this ;
    var cb = arguments[arguments.length -1];
    var methodName = arguments[0];
    var args, kwargs;
    if (arguments.length == 2){
        args = new Array() ;
        kwargs = new Object() ;
    }else if (arguments.length == 3){
        if (arguments[1].constructor == Array){
            args = arguments[1];
            kwargs = {};
        } else if (arguments[1].constructor == Object){
            args = [];
            kwargs = arguments[1];
        }
    }else if (arguments.length == 4){
        args = arguments[1];
        kwargs = arguments[2];
        // Now check to make sure we have what we want.
        if (!(args.constructor == Array)){
            throw new TypeError("Second positional argument is not of type [object Array]", "proxy.js")
        }
        if (!(kwargs.constructor == Object)){
            throw new TypeError("Third position arguments is not of type [object Object]", "proxy.js")
        }
    }
    var invokeCallback = function(){
        var dataCall = {
            "object": self.objectName,
            "params": args,
            "method": methodName,
            "kwargs": kwargs,
        }
        var dataCallJSON = JSON.stringify(dataCall);
        self.logger.debug1("callMethod: dataCallJSON: {}".format(dataCallJSON));
        var msgCall = new message.Message(message.MSG_INVOKE, dataCallJSON, 0, 0);
        return msgCall;
    }
    return new RemoteMethodCall(self, invokeCallback, cb);
}

Proxy.prototype.consumeHandshake = function(self){
    // console.log("setMethods external: Called.")
    return function(msg){
        var msgData = JSON.parse(msg.data)
        self.logger.debug("setMethods internal: Called.")
        self.logger.debug1("setMethods internal: msg: {}".format(msgData))
        if ("handshake" in msgData){
            var methods = msgData.meta.methods;
        }
    }
}

Proxy.prototype.dataCallback = function(self){
    return function(data){
        // self.logger.debug("dataCallback: Called. data size: {}".format(data.length));
        var msgs = message.Message.recv(data);
        msgs.forEach((msg)=>{
            var remoteCall = self.remoteCalls.shift();
            remoteCall.processData(msg);
        })
        self.client.end();
        // self.client.removeAllListeners('data');

    }
};

Proxy.prototype.endCallback = function(self){
    return function(){
        self.logger.debug("Connection closed.");
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

var NameServerProxy = function(host, port){
    if (!(this instanceof NameServerProxy)){
      return new NameServerProxy(arguments);
    }
    var nameServerName = NAMESERVER_NAME ;
    Proxy.call(this, host, port, nameServerName);
}

NameServerProxy.prototype = Object.create(Proxy.prototype);
NameServerProxy.prototype.constructor = NameServerProxy;

NameServerProxy.prototype.lookup = function(objectName, cb){
    return Proxy.prototype.callMethod.call(this,'lookup',[objectName],cb)
}

NameServerProxy.prototype.list = function(cb){
    return Proxy.prototype.callMethod.call(this,'list',cb)
}

exports.NameServerProxy = NameServerProxy ;
exports.Proxy = Proxy ;
