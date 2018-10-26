const io = require("socket.io-client")

const { Proxy } = require("./../lib/proxy.js")

var uri = "PYRO:BasicServer@localhost:50002"
// var address = "http://localhost:50002/Pyro.Daemon"
var address = "http://localhost:50002"
var socket = io(address, {path: "/Pyro.Daemon"})
socket.on("connect", function(){
    proxy = new Proxy(uri)
    socket.disconnect()
})
