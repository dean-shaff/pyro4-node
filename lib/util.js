const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format

var pythonBufferDataTypes = {
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

sizeOf = function(bufferInfo){
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
    // return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    return `[${info.label}] ${info.level}: ${info.message}`;
})

exports.formatter = formatter
exports.sizeOf = sizeOf;
