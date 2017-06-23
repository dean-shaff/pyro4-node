## Pyro4 client for node.js

Connect to Pyro4 object using node.js, using the Pyro4 JSON serializer.

### Usage

The example below shows how to access remote methods of an object with a known
host and port.

```javascript
const nro = require("pyro4-node")

function dataCallback(msg){
    console.log(msg.data);
}

var p = new nro.Proxy('localhost', 50001, 'BasicServer');
var res = p.callMethod('square', [2], dataCallback)
res.getResult()
var res1 = p.callMethod('cube', [100], dataCallback)
res1.getResult()
```

The following example shows how to access a Pyro4 nameserver, and list the
objects on the server.

```javascript
const nro = require("pyro4-node")
function dataCallback(msg){
    console.log(msg.data);
}
var ns = new nro.NameServerProxy('localhost',9090);
var resList = ns.list(dataCallback);
resList.getResult();
var resLookup = ns.lookup('BasicServer', dataCallback);
resLookup.getResult();
```
