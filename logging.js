require('./format');

exports.loggers = {};
exports.logLevel = 'INFO';
exports.logLevels =  {
        'ERROR':1,
        'INFO':2,
        'DEBUG':3,
        'DEBUG1':4,
}

exports.setLevel = function(level){
    exports.logLevel = level ;
    Object.keys(exports.loggers).forEach(function(name){
        exports.loggers[name].setLevel(level);
    });
}

function Logger(name, level,formatter){
    exports.loggers[name] = this;
    this.name = name ;
    if (level == null){
        this.level = exports.logLevel ;
    }

    if (formatter == null){
        this.formatter = "{}::{}::{}";
    }
    this.setLevel = function(level){
        this.level = level;
    }

    this.info = function(msg){
        if (exports.logLevels[this.level] >= 2){
            this.consoleOutput(msg, 'INFO');
        }
    };

    this.debug = function(msg){
        if (exports.logLevels[this.level] >= 3){
            this.consoleOutput(msg, "DEBUG");
        }
    };
    this.debug1 = function(msg){
        if (exports.logLevels[this.level] >= 4){
            this.consoleOutput(msg, "DEBUG1");
        }
    }
    this.error = function(msg){
        if (exports.logLevels[this.level] >= 1){
            this.consoleOutput(msg, "ERROR");
        }
    };

    this.consoleOutput = function(msg, level){
        // var d = new Date();
        // console.log(this.formatter.format(d.toLocaleString(), this.level, this.name, msg));
        console.log(this.formatter.format(level,this.name, msg));
    };
}

exports.Logger = Logger ;
// var logger = new Logger("planetTracker", "DEBUG");
// logger.info("My name is Dean");
// logger.debug("My name is also Dean");
