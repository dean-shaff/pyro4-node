// proxy-batched.js
const { Proxy } = require("./../index.js")

var main = async ()=>{
    var uri = "Pyro:TestServer@localhost:50001"
    await Proxy.with(uri, async (proxy)=>{
        var calls = []
        for (let i=1; i<=100; i++){
            calls.push(proxy.square([i]))
        }
        var resp = await Promise.all(calls)
        console.log(resp)
    })
}

main()
