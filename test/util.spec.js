const assert = require("assert")

const { locationParser, sizeOf, getObjMethods, getObjAttributes, initOptions } = require("./../lib/util.js")

class Dummy{
    constructor(){
        this._attr = null
    }

    method(){}

    get attr(){
        return this._attr
    }
    set attr(value){
        this._attr = value
    }
}

describe("locationParser", function(){
    it("should be able to handle list of arguments", function(){
        var {host, port} = locationParser("localhost", 50001)
        assert.strictEqual(host, "localhost")
        assert.strictEqual(port, 50001)
    })
    it("should be able to handle no arguments", function(){
        var {host, port} = locationParser()
        assert.strictEqual(host, "localhost")
        assert.strictEqual(port, 9090)
    })
    it("should be able to handle object as first argument", function(){
        var {host, port} = locationParser({host: "localhost", port: 50001})
        assert.strictEqual(host, "localhost")
        assert.strictEqual(port, 50001)
    })
})

describe("sizeOf", function(){})

describe("getObjMethods", function(){
    it("should be able to get methods", function(){
        var obj = new Dummy()
        var [methodNames, methods] = getObjMethods(obj)
        assert.strictEqual(methodNames.includes("method"), true)
        assert.strictEqual(methodNames.includes("attr"), false)
    })
})

describe("getObjAttributes", function(){
    it("should be able to get attributes", function(){
        var obj = new Dummy()
        var [attrNames, attrs] = getObjAttributes(obj)
        assert.strictEqual(attrNames.includes("attr"), true)
        assert.strictEqual(attrNames.includes("method"), false)
    })
})

describe("initOptions", function(){
    it("should be able to return empty object", function(){
        var options = initOptions(undefined)
        assert.strictEqual(typeof options, "object")
    })
    it("should be able to populate with default options", function(){
        var options = initOptions(undefined, {option1: true, option2: "hey"})
        assert.strictEqual(options.option1, true)
        assert.strictEqual(options.option2, "hey")
    })
    it("should be able to use provided options, even with default provided", function(){
        var options = initOptions({option1: false, option2: "howdy"}, {option1: true, option: "hey"})
        assert.strictEqual(options.option1, false)
        assert.strictEqual(options.option2, "howdy")
    })
})
