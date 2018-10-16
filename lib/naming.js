/**
 * NameServer and associated utilities
 */

const { Daemon } = require('./daemon.js')

class NameServer{
    constructor(){
        this.storage = {}
    }

    count(){
        return Object.keys(this.storage).length
    }

    lookup(name, options){}

    register(name, uri, options){}

    setMetadata(name, metadata){}

    remove(options){}

    list(options){}

    ping(){}
}

const getNsDaemon = (host, port)=>{

}

const startNs = (host, port)=>{

}

exports.NameServer = NameServer
exports.startNs = startNs
exports.getNsDaemon = getNsDaemon
