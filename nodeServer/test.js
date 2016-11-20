var async = require('async');

(function(){
var work = process._getActiveHandles().length;
async.waterfall([
	function(callback) {
		console.log('aa');
		callback(null);
	},
	function(callback) {
		console.log('fff');
		callback(null);
	},
],
function(err) {
	
});
console.log('first');
var newWork = (process._getActiveHandles().length) - work;
if(newWork > 0) {
    console.log("asynchronous work took place.");
} else {
	console.log('synchronous?' + newWork);
}
})();