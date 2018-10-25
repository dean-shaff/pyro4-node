const serializable = {}

const registerSerializableObject = (cls) => {
    serializable[cls.name] = cls
}

const convertFromDeserializedObj = (obj) => {
    if (obj === null) {
    } else if (obj.constructor === Object) {
        if ('__class__' in obj) {
            var clsName = obj.__class__.split('.')
            clsName = clsName[clsName.length - 1]
            if (clsName in serializable) {
                var cls = serializable[clsName]
                obj = cls.fromObj(obj)
            }
        }
    }
    return obj
}

const convertToSerializableObj = (obj) => {
    if (obj === null) {
    } else if (obj.constructor === Object) {
        if (obj.constructor.name in serializable) {
            obj = obj.toObj()
        }
    }
    return obj
}

exports.serializable = serializable
exports.registerSerializableObject = registerSerializableObject
exports.convertFromDeserializedObj = convertFromDeserializedObj
exports.convertToSerializableObj = convertToSerializableObj
