const EventEmitter = require('events')

class Configuration extends EventEmitter {
    constructor () {
        super()
        this.logLevel = {
            _Message: 'info',
            _Proxy: 'info',
            _Daemon: 'info',
            _URI: 'info',
            _PromiseSocket: 'info',
            _NameServer: 'info'
        }
        this.NS_PORT = 9090
        this.HOST = 'localhost'
        this.pyroName = 'PYRO'

        Object.keys(this.logLevel).forEach((prop) => {
            var module = prop.replace('_', '')
            var self = this
            Object.defineProperty(this.logLevel, module, {
                set: function (value) {
                    self.logLevel[prop] = value
                    let eventName = `logLevel.${module}`
                    self.emit(eventName, value)
                },
                get: function () {
                    return self.logLevel[prop]
                }
            })
        })
    }
    using (cls) {
        if (cls.name in this) {
            this[cls.name] = cls
        }
    }
}

const config = new Configuration()
exports.config = config
