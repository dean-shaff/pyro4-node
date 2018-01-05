const struct = require('ycstruct')
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format

const util = require("./util")
const config = require("./configuration").config

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

class Message{
    constructor(msgType, databytes, flags, seq, annotations){
        this.type = msgType ;
        this.data = databytes ; // Data should already by serialized.
        this.dataSize = this.data.length ;
        this.flags = flags ;
        this.serializerId = 2 ; // this the flag for the JSON serializer.
        this.seq = seq ;
        if (annotations == null){
            this.annotations = null;
            this.annotationsSize = 0 ;
        }else{
            this.annotations = annotations;
            this.annotationsSize = this.annotations.length ;
        }
    }

    toBytes(){
        return this.headerBytes() + this.data;
    }

    /**
     * This is the method used to generate the Data Buffer corresponding to the message header.
     * The header contains information about the length of the data, the type of serializer
     * (used in Python Pyro), and any information about the header.
     * @method headerBytes
     */
    headerBytes(){
        var checksum = (this.type + exports.PROTOCOL_VERSION + this.dataSize + this.annotationsSize + this.serializerId + this.flags + this.seq + Message.checksumMagic) & 0xffff;
        var pack = Message.headerStruct.pack('PYRO',exports.PROTOCOL_VERSION,
                    this.type, this.flags, this.seq,
                     this.dataSize, this.serializerId,
                      this.annotationsSize, 0, checksum)
        Message.logger.debug(`headerBytes: ${pack.toString("utf-8")}`);
        return pack.toString("utf-8");
    }

    /**
     * This the static method that gets called when a
     * response comes from the server.
     * @param {Buffer} data - The data buffer received from the host
     */
    static recv(data){
        Message.logger.debug(`recv: Total data size: ${data.length}`)
        var processData = function(data, start){
            var headerBuffer = data.slice(start, start+Message.headerSize);
            var headerData = Message.headerStruct.unpack(headerBuffer);
            Message.logger.debug(`recv.processData: headerData: ${headerData}`)
            var [tar, ver, msgType, flags, seq, dataSize, serializerId, annotationsSize, checksum] = headerData ;
            var annotationBuffer = data.slice(start+Message.headerSize, start+Message.headerSize+annotationsSize);
            var msgSize = Message.headerSize+annotationsSize+dataSize;
            Message.logger.debug(`recv.processData: start point: ${start}, `+
                                 `headerSize: ${Message.headerSize}, `+
                                 `annotationSize: ${annotationsSize}, `+
                                 `dataSize: ${dataSize}, `+
                                 `msgSize: ${msgSize}`)
            var dataBuffer = data.slice(start+Message.headerSize+annotationsSize, start+msgSize);
            return [new Message(msgType, dataBuffer.toString(), flags, seq), msgSize];
        }
        var processed = processData(data, 0);
        var size = processed[1];
        var msgs = [processed[0]] ;
        while (size < data.length){
            Message.logger.debug(`size at start: ${size}`)
            var processed = processData(data, size);
            size += processed[1];
            msgs.push(processed[0]);
            Message.logger.debug(`size at end: ${size}`);
        }
        return msgs;
    }
}

Message.headerFormat = '>4sHHHHiHHHH';
Message.headerStruct = new struct(Message.headerFormat);
Message.headerSize = util.sizeOf(Message.headerFormat);
Message.checksumMagic = 0x34E9;
Message.logger = createLogger({
    level: config.logLevel,
    transports:[
        new transports.Console()
    ],
    format: combine(
        label({ label: 'Message' }),
        util.formatter
    )
})

exports.Message = Message ;
