## Pyro4 client for node.js v2.2.1

Connect to Pyro4 objects using node.js, using the Pyro4 JSON serializer.

### Usage

#### Client-side

```javascript
// basic-proxy.js

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
// with-proxy.js
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

Launching name server:

```sh
me@local:~$ pyro4-node-ns
```

With nameserver running in background, we can register an object with a Daemon,
and then with the NameServer:

```javascript

// basic-server.js
const { locateNS, expose, Daemon, NameServerDaemon } = require("./../index.js")

class BasicServer{
    constructor(){
        this._name = "BasicServer"
    }

    get name(){
        return this._name
    }

    set name(value){
        this._name = value
    }

    square(x){
        return x**2
    }

    echo(val){
        return val
    }

    ping(){}
}

expose(BasicServer.prototype.echo)
expose(BasicServer.prototype.square)
expose(BasicServer, "name")

var main = async ()=>{
    var server = new BasicServer()
    // We're going to register our server object on port 50002
    var daemon = new Daemon({host: "localhost", port: 50002})
    var uri = daemon.register(server)
    // with name server running, assuming it's running on port 9090
    await locateNS(async (ns)=>{
        var resp = await ns.register(["BasicServer", uri.str])
    })
    console.log(`Server's URI is ${uri.str}`)
    await daemon.init()
}

main()
```

### Acknowledgements

Pyro4 is developed by Irmen de Jong. See [here](https://github.com/irmen/Pyro4/blob/master/LICENSE) for Pyro4's license.
