const assert = require("assert")

const { config } = require("./../lib/configuration.js")
const message = require("./../lib/message.js")


describe("Configuration", function(){
    it("should fire event emitter when log levels change", function(done){
        var newLevel = "info"
        config.on("logLevel.Message", (level)=>{
            assert.strictEqual(config.logLevel.Message, newLevel)
            assert.strictEqual(message.Message.logger.level, newLevel)
            done()
        })
        config.logLevel.Message = newLevel
    })
})
