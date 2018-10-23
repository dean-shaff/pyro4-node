const { spawn } = require("child_process")

const { config } = require("./../lib/configuration.js")

const { PromiseSocket } = require("./../lib/promise-socket.js")

config.logLevel.Proxy = "debug"
config.logLevel.Message = "debug"
config.logLevel.Daemon = "debug"
config.using(PromiseSocket)

const spawnPythonBasicServer = async ()=>{
    var pythonProcess = spawn("python", ["./basic_server.py"])
    return new Promise((resolve, reject)=>{
        pythonProcess.stdout.once("data", resolve)
        pythonProcess.stderr.once("data", reject)
    })
}

exports.spawnPythonBasicServer = spawnPythonBasicServer
