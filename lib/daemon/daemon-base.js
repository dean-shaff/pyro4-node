
class Daemon {
    constructor (location) {
        location = util.locationParser(location)
        // console.debug(`Daemon.constructor: location: ${JSON.stringify(location)}`)
        this.host = location.host
        this.port = location.port
        this.registeredObjects = {}
        var attrNames = util.getObjAttributes(this)[0]
        var methodNames = util.getObjMethods(this)[0]
        this.registeredObjects[constants.DAEMON_NAME] = [
            this,
            {
                methods: methodNames.filter(_exposedFilter(this)),
                attrs: attrNames.filter(_exposedFilter(this)),
                oneway: []
            }
        ]
        this._server = null
    }

    _handShake (objectId) {
        // console.debug(`_handShake: objectId: ${objectId}`)
        if (!(objectId in this.registeredObjects)) {
            throw new DaemonError(`_handShake: No object registered with object ID ${objectId}`)
        }
        var response = {
            handshake: 'hello',
            meta: this.registeredObjects[objectId][1]
        }
        var responsePayload = JSON.stringify(response)
        var msgType = message.MSG_CONNECTOK
        var msgResponse = new message.Message(
            msgType, responsePayload, 0, 0)
        return msgResponse
    }

    _invoke (object, method, params, kwargs, msgSeq) {
        // console.debug(`_invoke: objectId: ${object}`)
        var result
        if (object in this.registeredObjects) {
            var objInfo = this.registeredObjects[object]
            var objectMethods = objInfo[1].methods
            var obj = objInfo[0]
            if (method === '__getattr__') {
                result = obj[params[0]]
            } else if (method === '__setattr__') {
                result = (obj[params[0]] = params[1])
            } else if (objectMethods.includes(method)) {
                result = obj[method](...params)
                if (result === undefined) {
                    result = null
                }
            } else {
                throw new DaemonError(`_handleInvoke: Can't find method ${method} in this Daemon`)
            }
        } else {
            throw new DaemonError(`_handleInvoke: Can't find object ${object} in this Daemon`)
        }
        var resultSerialized = JSON.stringify(result)
        var msgResponse = new message.Message(
            message.MSG_RESULT, resultSerialized, 0, msgSeq
        )
        return msgResponse
    }

    register (obj, options) {
        var objectId = obj.constructor.name + uuid4()
        if (options !== undefined && options !== null) {
            if (options.constructor === Object) {
                if ('objectId' in options) {
                    objectId = options.objectId
                }
            }
        }
        // console.debug(
        //     `register: registering object with objectId: ${objectId}`)
        var attrNames = util.getObjAttributes(obj)[0]
        var methodNames = util.getObjMethods(obj)[0]
        // console.debug(
        //     `register: attribute names: ${attrNames}`
        // )
        // console.debug(
        //     `register: method names: ${methodNames}`
        // )
        this.registeredObjects[objectId] = [
            obj, {
                methods: methodNames.filter(_exposedFilter(obj)),
                attrs: attrNames.filter(_exposedFilter(obj)),
                oneway: []
            }
        ]
        // console.debug(
        //     `register: new registered object details: ${JSON.stringify(this.registeredObjects[objectId])}`)
        return new URI(
            { objName: objectId, host: this.host, port: this.port }
        )
    }

    /**
     * Unregister some object from this daemon.
     * @param  {Object/String} objOrId the object we wish to unregister, or
     * a string correponding to the object's registered ID
     * @return {null}
     */
    unregister (objOrId) {
        var targetObjectId
        if (objOrId.constructor === Object) {
            Object.keys(this.registeredObjects).forEach((objectId) => {
                let obj = this.registeredObjects[objectId][0]
                if (objOrId === obj) {
                    targetObjectId = objectId
                }
            })
        } else if (objOrId.constructor === String) {
            targetObjectId = objOrId
        }
        if (targetObjectId === undefined) {
            throw new DaemonError(`unregister: Couldn't find object ${objOrId}`)
        } else {
            // Daemon.logger.info(
            //     `unregister: Unregistering object with ID ${targetObjectId}`)
            delete this.registeredObjects[targetObjectId]
        }
    }

    /**
     * get information about an object and return it to the client.
     * @param  {String} objectId object's registered ID
     * @return {Object}          Object containing the the names of methods,
     *                           attributes, and oneway methods.
     */
    getMetadata (objectId) {
        if (objectId in this.registeredObjects) {
            return this.registeredObjects[objectId][1]
        } else {
            throw new DaemonError(
                `get_metadata: No object registered with object ID ${objectId}`)
        }
    }

    ping () { return null }

    registered () {
        return Object.keys(this.registeredObjects)
    }

    info () {
        return `${constants.DAEMON_NAME} bound on ${this.locationStr}, ` +
               `with ${Object.keys(this.registeredObjects).length} objects registered`
    }

    get locationStr () {
        return `${this.host}:${this.port}`
    }

    uriFor (objectOrId) {
        if (objectOrId.constructor === String) {
            if (objectOrId in this.registeredObjects) {
                return new URI(`PYRO:${objectOrId}@${this.locationStr}`)
            }
        } else {
            var objectId = null
            Object.keys(this.registeredObjects).forEach((id) => {
                var obj = this.registeredObjects[id][0]
                if (obj === objectOrId) {
                    objectId = id
                } else {
                    return null
                }
            })
            if (objectId === null) {
                throw new DaemonError(`Couldn't find object ${objectOrId}`)
            } else {
                return new URI(`PYRO:${objectId}@${this.locationStr}`)
            }
        }
    }
}
