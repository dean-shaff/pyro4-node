/**
 * NameServer and associated utilities
 */
const { initOptions, defaultLogger } = require('./util.js')
const { config } = require('./configuration.js')
const { NAMESERVER_NAME } = require('./constants.js')
const { Daemon, expose } = require('./daemon.js')
const { NamingError, UnsuppportedFeatureError } = require('./errors.js')

class NameServer {
    constructor () {
        this.storage = {}
    }

    count () {
        NameServer.logger.debug(`count`)
        return Object.keys(this.storage).length
    }

    lookup (name, options) {
        NameServer.logger.debug(`lookup: ${name}`)
        options = initOptions(options, { returnMetadata: false })
        try {
            var [uri, metadata] = this.storage[name]
            if (options.returnMetadata) {
                return [uri, metadata]
            } else {
                return uri
            }
        } catch (e) {
            throw new NamingError(`Couldn't find name ${name}`, { err: e })
        }
    }

    register (name, uri, options) {
        NameServer.logger.debug(`register: ${name}, ${uri}`)
        options = initOptions(options, { metadata: null })
        this.storage[name] = [uri, options.metadata]
    }

    setMetadata (name, metadata) {
        if (name in this.storage) {
            this.storage[name][1] = metadata
        }
    }

    remove (...options) {
        var name
        if (options.length > 0) {
            if (options[0].constructor === Object) {
                options = initOptions(options,
                                      { name: null, prefix: null, regex: null })
                name = options.name
            } else {
                name = options[0]
            }
        }

        if (name === undefined) {
            throw new UnsuppportedFeatureError(
                "Can't remove objects from nameserver without providing a name")
        }
        delete this.storage[name]
    }

    list (options) {
        options = initOptions(options, {
            prefix: null,
regix: null,
            metadataAll: null,
metadataAny: null,
            returnMetadata: null
        })
        if (
            options.prefix !== null ||
            options.regix !== null ||
            options.metadataAll !== null ||
            options.metadataAny !== null ||
            options.returnMetadata !== null
        ) {
            throw new UnsuppportedFeatureError(
                "Can't use any of the features other than bare usage")
        }
        return this.storage
    }

    ping () { return null }
}

// NameServer.logger = defaultLogger('NameServer')
expose(NameServer.prototype.count)
expose(NameServer.prototype.lookup)
expose(NameServer.prototype.register)
expose(NameServer.prototype.setMetadata)
expose(NameServer.prototype.remove)
expose(NameServer.prototype.list)
expose(NameServer.prototype.ping)

class NameServerDaemon extends Daemon {
    constructor (location) {
        super(location)
        this.nameServer = new NameServer()
        var nsURI = this.register(
            this.nameServer, { objectId: NAMESERVER_NAME }
        )
        this.nameServer.register(
            NAMESERVER_NAME, nsURI, { metadata: ['NameServer'] })
    }
}

const startNs = async (options) => {
    var ns = new NameServerDaemon(options)
    return ns.init().then(() => {
        return ns
    })
}

exports.NameServer = NameServer
exports.NameServerDaemon = NameServerDaemon
exports.startNs = startNs

if (typeof require !== 'undefined' && require.main === module) {
    var main = async (options) => {
        config.logLevel.Daemon = 'debug'
        config.logLevel.Message = 'debug'
        config.logLevel.NameServer = 'debug'
        console.log('Firing up NameServer')
        var ns = await startNs(options)
        console.log(`NameServer URI: ${ns.uriFor(NAMESERVER_NAME).str}`)
    }
    main()
}
