/* eslint no-unused-vars: 1, new-cap: 1 */
/**
 * message.js
 * A reimplementation of Irmen de Jong's Pyro4 messaging protocol in Javascript.
 */
const struct = require('ycstruct')

const util = require('./util.js')

exports.PROTOCOL_VERSION = 48
exports.MSG_CONNECT = 1
exports.MSG_CONNECTOK = 2
exports.MSG_CONNECTFAIL = 3
exports.MSG_INVOKE = 4
exports.MSG_RESULT = 5
exports.MSG_PING = 6
exports.FLAGS_EXCEPTION = 1 << 0
exports.FLAGS_COMPRESSED = 1 << 1
exports.FLAGS_ONEWAY = 1 << 2
exports.FLAGS_BATCH = 1 << 3
exports.FLAGS_META_ON_CONNECT = 1 << 4
exports.FLAGS_ITEMSTREAMRESULT = 1 << 5
exports.FLAGS_KEEPSERIALIZED = 1 << 6

class Message {
    constructor (msgType, databytes, flags, seq, annotations) {
        this.type = msgType
        this.data = databytes // Data should already by serialized.
        this.dataSize = this.data.length
        this.flags = flags
        this.serializerId = 2 // this the flag for the JSON serializer.
        this.seq = seq
        if (annotations == null) {
            this.annotations = null
            this.annotationsSize = 0
        } else {
            this.annotations = annotations
            this.annotationsSize = this.annotations.length
        }
    }

    /**
     * get the header information and add it to the message data
     * @return {String} - header + data
     */
    toBytes () {
        let headerBuffer = this.headerBytes()
        let msgBytes = Buffer.concat([headerBuffer, Buffer.from(this.data)])
        // console.debug(`toBytes: msg size: ${msgBytes.length}`)
        return msgBytes
    }

    /**
     * This is the method used to generate the Data Buffer corresponding to the message header.
     * The header contains information about the length of the data, the type of serializer
     * (used in Python Pyro), and any information about the header.
     * @method headerBytes
     */
    headerBytes () {
        var checksum = (this.type + exports.PROTOCOL_VERSION + this.dataSize +
                        this.annotationsSize + this.serializerId + this.flags +
                        this.seq + Message.checksumMagic) & 0xffff
        // console.debug(`headerBytes: type: ${this.type}, dataSize: ${this.dataSize}, ` +
        //                      `annotationsSize: ${this.annotationsSize}, ` +
        //                      `serializerId: ${this.serializerId}, ` +
        //                      `flags: ${this.flags}, `+
        //                      `seq: ${this.seq}`)
        // console.debug(`headerBytes: checksum: ${checksum}`)
        var headerBuffer = Message.headerStruct.pack(
            'PYRO', exports.PROTOCOL_VERSION,
            this.type, this.flags, this.seq,
            this.dataSize, this.serializerId,
            this.annotationsSize, 0, checksum
        )
        // console.debug(`headerByles: headerBuffer.toString(): ${headerBuffer}`)
        // console.debug(`headerBytes: headerBuffer: ${nodeUtil.inspect(headerBuffer)}`)
        // console.debug(`headerBytes: headerBuffer.length: ${headerBuffer.length}`)
        return headerBuffer
    }

    /**
     * This the static method that gets called when a
     * response comes from the server.
     * @param {Buffer} data - The data buffer received from the host
     * @returns {Array} - An array of Message instances.
     */
    static recv (data) {
        // console.debug(`recv: Total data size: ${data.length}`)
        var processData = (data, start) => {
            let headerBuffer = Buffer.from(data.slice(start, start + Message.headerSize))
            // console.debug(`recv.processData: headerBuffer.toString(): ${headerBuffer}`)
            // console.debug(`recv.processData: headerBuffer: ${nodeUtil.inspect(headerBuffer)}`)
            // console.debug(`recv.processData: headerBuffer.length: ${headerBuffer.length}`)
            let headerData = Message.headerStruct.unpack(headerBuffer) // 0.015 ms
            // console.debug(`recv.processData: headerData: ${headerData}`)
            let [tar, ver, msgType, flags, seq, dataSize,
                 serializerId, annotationsSize, checksum] = headerData
            let annotationBuffer = data.slice(
                    start + Message.headerSize,
                    start + Message.headerSize + annotationsSize
            )
            let msgSize = Message.headerSize + annotationsSize + dataSize
            // console.debug(`recv.processData: start point: ${start}, `+
            //                      `headerSize: ${Message.headerSize}, `+
            //                      `annotationSize: ${annotationsSize}, `+
            //                      `dataSize: ${dataSize}, `+
            //                      `msgType: ${msgType}, `+
            //                      `flags: ${flags}, `+
            //                      `seq: ${seq}, `+
            //                      `msgSize: ${msgSize}`)
            let dataBuffer = Buffer.from(data.slice(
                start + Message.headerSize + annotationsSize,
                start + msgSize
            ))
            // console.debug(`recv.processData: dataBuffer: ${dataBuffer}`)
            return [new Message(msgType, dataBuffer.toString(), flags, seq), msgSize]
        }
        var processed = processData(data, 0)
        var size = processed[1]
        var msgs = [processed[0]]
        while (size < data.length) {
            // console.debug(`recv: size at start: ${size}`)
            let processed = processData(data, size)
            if (processed === null) {
                break
            }
            size += processed[1]
            msgs.push(processed[0])
            // console.debug(`recv: size at end: ${size}`)
        }
        return msgs
    }
}

Message.headerFormat = '>4sHHHHiHHHH'
Message.headerStruct = new struct(Message.headerFormat)
Message.headerSize = util.sizeOf(Message.headerFormat)
Message.checksumMagic = 0x34E9
// Message.logger = util.defaultLogger('Message')

exports.Message = Message
