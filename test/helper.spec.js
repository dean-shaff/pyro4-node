const assert = require("assert")

const { wait } = require("./../lib/util.js")

const { spawnPythonBasicServer } = require("./helper.js")

describe.skip("spawnPythonBasicServer", function(){
    it("should be able to launch Python Pyro4 server", async function(){
        var [data, process] = await spawnPythonBasicServer()
        await wait(500).then(()=>{
            console.log(`${data}`)
            process.kill()
        })
    })
})
