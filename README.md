## Pyro4 client for node.js v2.0.0

Connect to Pyro4 objects using node.js, using the Pyro4 JSON serializer.

### Usage

Taken from `./examples/basic_example.js`

```javascript
const { Proxy } = require("./../index.js")

var main = async ()=>{
    var p = new Proxy({objName: "BasicServer", port: 50001, host: "localhost"})
    await p.init()
    console.log(await p.square([2]))
    console.log(await p.name)
    await p.end()
}

main()
```

### Acknowledgements

Pyro4 is developed by Irmen de Jong. See [here](https://github.com/irmen/Pyro4/blob/master/LICENSE) for Pyro4's license.
