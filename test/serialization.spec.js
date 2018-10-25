const assert = require("assert")

const { serializable, registerSerializableObject } = require("./../lib/serialization.js")


describe("registerSerializableObject", function(){
    it("should be able to register some new class", function(){
        class NewClass {
            toObj(){return {}}
        }
        NewClass.fromObj = ()=>{return new NewClass()}
        registerSerializableObject(NewClass)
        assert.strictEqual("NewClass" in serializable, true)
    })
})
