const path = require("path")
const { spawn } = require("child_process")

const { config } = require("./../lib/configuration.js")

const { PromiseSocket } = require("./../lib/promise-socket.js")

config.logLevel.Proxy = "debug"
config.logLevel.Message = "debug"
config.logLevel.Daemon = "debug"
config.using(PromiseSocket)

const spawnPythonTestServer = async ()=>{
    var pathToTestServer = path.join(__dirname, "test_server.py")
    var pythonProcess = spawn("python3", [pathToTestServer])
    return new Promise((resolve, reject)=>{
        pythonProcess.stdout.once("data", resolve)
        pythonProcess.stderr.once("data", reject)
    }).then((data)=>{
        return [data, pythonProcess]
    }).catch((err)=>{
        console.error(`stderr: ${err}`)
        console.error("Make sure Python3 and Pyro4 are installed")
    })
}

exports.spawnPythonTestServer = spawnPythonTestServer
