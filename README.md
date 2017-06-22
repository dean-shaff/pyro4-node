## Pyro4 client for node.js

Connect to Pyro4 object using node.js, using the Pyro4 JSON serializer.

### Usage

```javascript
const remote = require("./lib/proxy")

function dataCallback(msg){
    console.log(msg.data);
}

var p = new remote.Proxy('localhost', 50001, 'BasicServer');
var res = p.callMethod('square', [2], null, dataCallback)
res.getResult()
var res1 = p.callMethod('cube', [100], null, dataCallback)
res1.getResult()
```
