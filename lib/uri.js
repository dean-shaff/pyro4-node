const { defaultLogger } = require("./util.js")
const { config } = require("./configuration.js")
const { SerializationError } = require("./errors.js")
const { registerSerializableObject } = require("./serialization.js")

class URI{
    constructor(uri){
        var protocol = "PYRO"
        if (uri.constructor === URI){
            var state = uri.state
            this.state = state
            return
        } else if (uri.constructor === Object){
            var {host, port, objName} = uri
        } else if (uri.constructor === String){
            var {protocol, host, port, objName} = this._parseStringURI(uri)
        } else if (uri.constructor === Array){
            var [protocol, objName, _, host, port] = uri
        }
        this.protocol = protocol
        this.host = host
        this.port = port
        this.object = objName
    }

    _parseStringURI(uri){
        var [protocol, objNameHost, port] = uri.split(":")
        var [objName, host] = objNameHost.split("@")
        return {
            protocol: protocol,
            host: host,
            port: parseInt(port),
            objName, objName
        }
    }

    set state(value){
        this.protocol = value.protocol
        this.host = value.host
        this.port = value.port
        this.object = value.object
    }

    get state(){
        return {
            protocol: this.protocol,
            host: this.host,
            port: this.port,
            object: this.object
        }
    }

    get location(){
        return `${this.host}:${this.port}`
    }

    get str(){
        return `${this.protocol}:${this.object}@${this.host}:${this.port}`
    }

    toObj(){
        var s = this.state
        return {
            "__class__": "Pyro4.core.URI",
            "state": [s.protocol, s.object, null, s.host, s.port]
        }
    }
}

URI.fromObj = function(obj){
    if (obj.__class__.search("URI") !== -1){
        return new URI(obj.state)
    } else {
        throw new SerializationError(`Can't get a URI from class ${obj.__class__}`)
    }
}

URI.logger = defaultLogger("URI")
registerSerializableObject(URI)

exports.URI = URI
