const assert = require("assert")

const { locationParser, sizeOf, getObjMethods, getObjAttributes } = require("./../lib/util.js")

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

describe("locationParser", function(){})

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
