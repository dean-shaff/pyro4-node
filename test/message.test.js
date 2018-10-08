const assert = require("assert")
const util = require("util")

const utf8 = require("utf8")

const message = require("./../lib/message.js")


describe("Message", function(){
    var msgConnect = null
    var msgConnectHeaderTrue = "PYRO\u00000\u0000\u0001\u0000\u0010\u0000\u0000" +
                               "\u0000\u0000\u0000,\u0000\u0002\u0000\u0000\u0000\u00005X"
    var msgMethod = null
    var msgProperty = null
    var objName = "BasicServer"
    before(function(){
        var remoteCallData = {
            handshake: "hello",
            object: objName
        }
        msgConnect = new message.Message(
            message.MSG_CONNECT,
            JSON.stringify(remoteCallData),
            message.FLAGS_META_ON_CONNECT,
            0
        )
    })

    describe("toBytes", function(){
        it("should correctly dump connect Message to bytes", async function(){
            var msgConnectBytes = await msgConnect.toBytes()
            assert.strictEqual(
                msgConnectBytes,
                `${msgConnectHeaderTrue}{"handshake":"hello","object":"BasicServer"}`)
        })
    })
    describe("headerBytes", function(){
        it("should correctly dump connect Message header bytes", async function(){
            var msgConnectHeaderBytes = await msgConnect.headerBytes()
            assert.strictEqual(
                msgConnectHeaderBytes,
                msgConnectHeaderTrue
            )
        })
    })
    describe("recv", function(){
        it("should unpack data from client", async function(){
        })
    })
})
