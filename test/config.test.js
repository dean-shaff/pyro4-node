const assert = require("assert")

const { config } = require("./../lib/configuration.js")

describe("Configuration", function(){
    it("should fire event emitter when log levels change", function(done){
        config.on("logLevel.Message", (level)=>{
            assert.strictEqual(config.logLevel.Message, "info")
            done()
        })
        config.logLevel.Message = "info"
    })
})
