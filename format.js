String.prototype.format = function(){		
	var re_all = /{(\d+)?(:(\d+)?(.\d+?f))?}/g;
	var re_index = /(\d+):/;
	var re_before = /(\d+)\./;
	var re_after = /\.(\d+)/;
	var cur = this;
	var matches = cur.match(re_all);
	if (arguments.length > matches){
		console.log("Too many arguments!");
		return cur;
	}else{
		for (var i=0; i<arguments.length;i++){
			var match_i = matches[i];
			var arg_index = match_i.match(re_index);
			var arg ; 
			if (arg_index != null){
				arg = arguments[arg_index[1]];
			}else{
				arg = arguments[i];
			}
			var f_after = match_i.match(re_after);
			if (f_after != null){
				var val = f_after[1];
				var pow_val = Math.pow(10,-val);
				arg = arg.toFixed(val);
			}else{
				var f_before = match_i.match(re_before); 
				if (f_before != null){
					var val = f_before[1];
					var pow_val = Math.pow(10,val)
					arg = Math.floor(arg / pow_val)*pow_val;
				}else{
				}
			}
			cur = cur.replace(match_i, arg.toString());
		}
		return cur;	
	}
}

