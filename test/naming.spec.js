const assert = require("assert")

require("./helper.js")
const { NameServer, startNs, getNsDaemon } = require("./../lib/naming.js")

describe("NameServer", function(){

    var ns
    before(function(){
        ns = new NameServer()
    })

    describe("register", function(){
        it("should be able to register an object on the nameserver", function(){})
        describe("count", function(){
            it("should be able to count number of objects on server", function(){})
        })
        describe("lookup", function(){
            it("should be able to lookup an object on the nameserver", function(){})
        })
        describe("set_metadata", function(){

        })
        describe("remove", function(){
            it("should be able to remove a registered object from the nameserver", function(){

            })
            it("should be able to recognize when attempting to remove an object that isn't registered", function(){

            })
        })
        describe("list", function(){
            it("should be able to list objects on the nameserver", function(){})
        })
    })

    describe("ping", function(){
        it("should be able to call dummy ping method", function(){})
    })
})

describe("startNs", function(){
    it("should be able to call startNs function", function(){

    })
})

describe("getNsDaemon", function(){
    it("should be able to get a daemon associated with a nameserver object", function(){

    })
})
