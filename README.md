## Pyro4 client for node.js v2.2.0

Connect to Pyro4 objects using node.js, using the Pyro4 JSON serializer.

### Usage

#### Client-side

```javascript
const { Proxy } = require("./../index.js")

var main = async ()=>{
    var p = new Proxy("Pyro:BasicServer@localhost:50001")
    await p.init()
    console.log(await p.square([2]))
    console.log(await p.name.get())
    await p.end()
}

main()
```

In order to avoid having to call `Proxy.init` and `Proxy.end`, use the the
`Proxy.with` function:

```javascript
const { Proxy } = require("./../index.js")

var main = async ()=>{
    var uri = "Pyro:BasicServer@localhost:50001"
    await Proxy.with(uri, async (proxy)=>{
        console.log(await proxy.square([2]))
        console.log(await proxy.name.get())
        console.log(await proxy.echo(["hey there"]))
    })
}

main()
```

#### Server-side



### Acknowledgements

Pyro4 is developed by Irmen de Jong. See [here](https://github.com/irmen/Pyro4/blob/master/LICENSE) for Pyro4's license.
