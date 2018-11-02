var main = async () => {
    var uri = "PYRO_WS:BasicServer@localhost:50002"
    try {
        var proxy = new WebSocketProxy(uri)
    } catch (err) {
        console.log(err)
    }
    await proxy.init()
    console.time("calls")
    var promises = []
    for (let i=0; i<100; i++){
        promises.push(proxy.square([i]))
    }
    var resp = await Promise.all(promises)
    console.log(resp)
    console.timeEnd("calls")
    await proxy.end()
}

main()
