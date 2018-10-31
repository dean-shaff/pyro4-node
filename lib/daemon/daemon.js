const uuid4 = require('uuid4')

const util = require('./util.js')
const message = require('./message.js')
const constants = require('./constants.js')
const { DaemonError } = require('./errors.js')
const { URI } = require('./uri.js')

const expose = (...args) => {
    var exposeMethod = (method) => {
        method._pyroExposed = true
    }
    var exposePropertyDescriptor = (propDescriptor) => {
        var getSet = ['get', 'set']
        getSet.forEach((name) => {
            if (name in propDescriptor) {
                propDescriptor[name]._pyroExposed = true
            }
        })
    }

    if (args.length === 1) {
        if (args[0].constructor === Object) {
            exposePropertyDescriptor(args[0])
        } else if (args[0].constructor === Function) {
            exposeMethod(args[0])
        }
    } else if (args.length === 2) {
        var [cls, prop] = args
        var propDescriptor = Object.getOwnPropertyDescriptor(
            cls.prototype, prop
        )
        exposePropertyDescriptor(propDescriptor)
    }
}

const _exposedFilter = (obj) => {
    var objProto = Object.getPrototypeOf(obj)
    return (name) => {
        if (name.startsWith('_') || name.startsWith('__')) {
            return false
        }
        var prop = Object.getOwnPropertyDescriptor(objProto, name)
        if ('value' in prop) {
            if (prop.value._pyroExposed) {
                return true
            }
        }
        var getSet = ['get', 'set']
        var getSetBool = false
        getSet.forEach((n) => {
            if (prop[n]) {
                if (prop[n]._pyroExposed) {
                    getSetBool = true
                }
            }
        })
        return getSetBool
    }
}

class DaemonBase {

}



Daemon.prototype.get_metadata = Daemon.prototype.getMetadata
expose(Daemon.prototype.get_metadata)
expose(Daemon.prototype.ping)
expose(Daemon.prototype.info)
expose(Daemon.prototype.registered)

exports.expose = expose
exports.Daemon = Daemon
