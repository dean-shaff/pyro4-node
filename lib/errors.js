class ConnectionError{
    constructor(msg, details){
        this.msg = msg
        if (details != undefined){
            this.details = details
        }else{
            this.details = {}
        }
    }
}

class DaemonError extends ConnectionError{}


exports.ConnectionError = ConnectionError
exports.DaemonError = DaemonError
