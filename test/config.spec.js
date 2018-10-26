const assert = require("assert")

require("./helper.js")
const { config } = require("./../lib/configuration.js")
const message = require("./../lib/message.js")


describe("Configuration", function(){
    it("should fire event emitter when log levels change", function(done){
        var newLevel = "info"
        config.on("logLevel.Message", (level)=>{
            assert.strictEqual(config.logLevel.Message, newLevel)
            done()
        })
        config.logLevel.Message = newLevel
    })
    it("should be able to set the PromiseSocket constructor", function(){
        var { PromiseSocket } = require("./../lib/promise-socket.js")
        config.using(PromiseSocket)
    })
})
