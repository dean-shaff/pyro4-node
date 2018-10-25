const assert = require("assert")
const util = require("util")

require("./helper.js")
const message = require("./../lib/message.js")
const { config } = require("./../index.js")

describe("Message", function(){
    var msgConnect = null
    var msgConnectHeaderTrue = Buffer.from(
        'PYRO\u00000\u0000\u0001\u0000\u0010\u0000\u0000\u0000\u0000\u0000+'+
        '\u0000\u0002\u0000\u0000\u0000\u00005W'
    )
    // var msgConnectHeaderTrue = Buffer.from('PYRO0+5W')
    var msgConnectBytesTrue = Buffer.concat(
        [msgConnectHeaderTrue,
         Buffer.from('{"handshake":"hello","object":"TestServer"}')]
    )
    var msgMethod = null
    var msgProperty = null
    var objName = "TestServer"
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
                msgConnectBytes.equals(msgConnectBytesTrue), true)
        })
    })
    describe("headerBytes", function(){
        it("should correctly dump connect Message header bytes", async function(){
            var msgConnectHeaderBytes = await msgConnect.headerBytes()
            console.log(msgConnectHeaderBytes.toString())
            assert.strictEqual(
                msgConnectHeaderBytes.equals(msgConnectHeaderTrue), true)
        })
    })
    describe("recv", function(){
        it("should unpack data from client", async function(){
        })
    })
})
