class BaseError {
    constructor (msg, details) {
        this.msg = msg
        if (details !== undefined && details !== null) {
            this.details = details
        } else {
            this.details = {}
        }
    }
}

class ConnectionError extends BaseError {}

class DaemonError extends BaseError {}

class NamingError extends BaseError {}

class UnsuppportedFeatureError extends BaseError {}

class SerializationError extends BaseError {}

exports.BaseError = BaseError
exports.ConnectionError = ConnectionError
exports.DaemonError = DaemonError
exports.NamingError = NamingError
exports.UnsuppportedFeatureError = UnsuppportedFeatureError
exports.SerializationError = SerializationError
