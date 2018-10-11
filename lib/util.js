const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf } = format

const { config } = require("./configuration.js")

const pythonBufferDataTypes = {
    "c":1,
    "b":1,
    "B":1,
    "?":1,
    "h":2,
    "H":2,
    "i":4,
    "I":4,
    "l":4,
    "L":4,
    "q":8,
    "Q":8,
    "f":4,
    "d":8,
    "s":1,
    "p":1
}

const sizeOf = function(bufferInfo){
    var count = 0;
    var pattern = /(\d+.)/g;
    var n, dt ; // number and datatype
    bufferInfo.match(pattern).forEach((m)=>{
        dt = m[m.length-1];
        n = parseInt(m.slice(0,m.length-1),10);
        count += n*pythonBufferDataTypes[dt];
        bufferInfo = bufferInfo.replace(m, "");
    });
    var key;
    for (var i=0; i<bufferInfo.length; i++){
        key = bufferInfo[i];
        if (key in pythonBufferDataTypes){
            count += pythonBufferDataTypes[key];
        }
    }
    return count;
}

const formatter = printf((info)=>{
    return `[${info.label}] ${info.level}: ${info.message}`;
})

const locationParser = function(location){
    var host = config.host
    var port = config.port
    var objName = ""
    if (location != undefined){
        if (location.constructor === Array){
            [host, port, objName] = location
        }else if (location.constructor === Object){
            host = location.host
            port = location.port
            objName = location.objName
        }
    }
    return {host: host, port:port, objName: objName}
}

const getObjMethods = function(obj){
    var objProto = Object.getPrototypeOf(obj)
    var props = Object.getOwnPropertyNames(objProto)
    return props
}

const defaultLogger = function(name){
    var logger = createLogger({
        level: config.logLevel[name],
        transports:[
            new transports.Console()
        ],
        format: combine(
            label({ label: name }),
            formatter
        )
    })
    config.on(`logLevel.${name}`, (level)=>{
        logger.level = level
    })
    return logger
}

const wait = async (t)=>{
    return new Promise((resolve, reject)=>{
        setTimeout(resolve, t)
    })
}


exports.locationParser = locationParser
exports.formatter = formatter
exports.sizeOf = sizeOf
exports.getObjMethods = getObjMethods
exports.defaultLogger = defaultLogger
exports.wait = wait
