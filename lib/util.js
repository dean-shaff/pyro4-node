// const { createLogger, format, transports } = require('winston')
// const { combine, label, printf } = format

const { config } = require('./configuration.js')

const pythonBufferDataTypes = {
    'c': 1,
    'b': 1,
    'B': 1,
    '?': 1,
    'h': 2,
    'H': 2,
    'i': 4,
    'I': 4,
    'l': 4,
    'L': 4,
    'q': 8,
    'Q': 8,
    'f': 4,
    'd': 8,
    's': 1,
    'p': 1
}

const sizeOf = function (bufferInfo) {
    var count = 0
    var pattern = /(\d+.)/g
    var n, dt // number and datatype
    bufferInfo.match(pattern).forEach((m) => {
        dt = m[m.length - 1]
        n = parseInt(m.slice(0, m.length - 1), 10)
        count += n * pythonBufferDataTypes[dt]
        bufferInfo = bufferInfo.replace(m, '')
    })
    var key
    for (var i = 0; i < bufferInfo.length; i++) {
        key = bufferInfo[i]
        if (key in pythonBufferDataTypes) {
            count += pythonBufferDataTypes[key]
        }
    }
    return count
}

const locationParser = (...location) => {
    var host = config.HOST
    var port = config.NS_PORT
    if (location[0] !== undefined) {
        if (location[0].constructor === Object) {
            host = location[0].host
            port = location[0].port
        } else {
            [host, port] = location
        }
    }
    return { host: host, port: port }
}

const getObjProperties = (obj) => {
    var objProto = Object.getPrototypeOf(obj)
    var props = Object.getOwnPropertyDescriptors(objProto)
    return props
}

const getObjMethods = (obj) => {
    var props = getObjProperties(obj)
    var methodNames = Object.keys(props).filter((propName) => {
        var prop = props[propName]
        if ('value' in prop) {
            if (prop.value.constructor === Function) {
                return true
            }
        }
        return false
    })
    var methods = methodNames.reduce((obj, methodName) => {
        obj[methodName] = props[methodName]
        return obj
    }, {})
    return [methodNames, methods]
}

const getObjAttributes = (obj) => {
    var props = getObjProperties(obj)
    var attrNames = Object.keys(props).filter((propName) => {
        var prop = props[propName]
        if ('get' in prop || 'set' in prop) {
            return true
        }
        return false
    })
    var attrs = attrNames.reduce((obj, attrName) => {
        obj[attrName] = props[attrName]
        return obj
    }, {})
    return [attrNames, attrs]
}

// const formatter = printf((info) => {
//     return `[${info.label}] ${info.level}: ${info.message}`
// })
//
// const defaultLogger = function (name) {
//     var logger = createLogger({
//         level: config.logLevel[name],
//         transports: [
//             new transports.Console()
//         ],
//         format: combine(
//             label({ label: name }),
//             formatter
//         )
//     })
//     config.on(`logLevel.${name}`, (level) => {
//         logger.level = level
//     })
//     return logger
// }

const wait = async (t) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, t)
    })
}

const initOptions = (options, defaultOptions) => {
    if (options === undefined) {
        options = {}
    }
    if (defaultOptions === undefined) {
        defaultOptions = {}
    }
    return Object.assign(defaultOptions, options)
}

/**
 * copy methods and properties from source to target in place
 * @param  {[type]} target [description]
 * @param  {[type]} source [description]
 * @return {[type]}        [description]
 */
const copyObject = (target, source) => {
    var sourceProps = Object.getOwnPropertyDescriptors(source)
    Object.keys(sourceProps).forEach((propName) => {
        let prop = sourceProps[propName]
        Object.defineProperty(target, propName, prop)
    })

    var sourceMethods = Object.getOwnPropertyDescriptors(
        Object.getPrototypeOf(source)
    )
    Object.keys(sourceMethods).forEach((methodName) => {
        let method = sourceMethods[methodName]
        if (methodName !== "constructor") {
            Object.defineProperty(target, methodName, method)
        }
    })
}

exports.locationParser = locationParser
exports.sizeOf = sizeOf
exports.getObjMethods = getObjMethods
exports.getObjAttributes = getObjAttributes
// exports.formatter = formatter
// exports.defaultLogger = defaultLogger
exports.wait = wait
exports.initOptions = initOptions
exports.copyObject = copyObject
