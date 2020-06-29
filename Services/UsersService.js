module.exports = function UsersService(instance){

	var self = this;

	function initialise(cb){
		cb(null,true);
	}

	function loginUser(userInfo,cb){

	}


	this.initialise = initialise;
	this.loginUser = loginUser;
}