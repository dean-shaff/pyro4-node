const assert = require("assert")

const { wait } = require("./../lib/util.js")

const { spawnPythonTestServer } = require("./helper.js")

describe.skip("spawnPythonTestServer", function(){
    it("should be able to launch Python Pyro4 server", async function(){
        var [data, process] = await spawnPythonTestServer()
        await wait(500).then(()=>{
            console.log(`${data}`)
            process.kill()
        })
    })
})
