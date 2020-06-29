module.exports = function SharesService(instance){

	var self = this
	,	ObjectID = require('mongodb').ObjectID
	,	mongoService = null
	,	async = require('async')
	,	updateShareCalled = false
	;

	function initialise(cb){
		
		instance.getService("MongoDBService",(err,mongo)=>{
			if(err){
				cb(err,null);
				return;
			}
			mongoService = mongo;	
			cb(null,true);
		});
	}

	function getAllShares(userId){
		mongoService.find("Shares",{"userId":userId},{},(err,allShares)=>{
			if(err)return;
			instance.io.sockets.emit("ALL_SHARES_"+userId,allShares)
		});
		if(!updateShareCalled){
			updateShareCalled = true
			setTimeout(updateShareValue,1*1000)
		}

	}

	function updateShareValue(){
	
		mongoService.find("Shares",{},{},(err,allShares)=>{
			if(err)return;

			async.mapSeries(allShares,function(eachShare,done){
				var value = getRandomValue();
				let obj = {value:value,id:eachShare._id}

				mongoService.findOneAndUpdate("Shares",{"_id":ObjectID(eachShare._id)},{$set:{"currentValue":value}},{},(err,res)=>{
					if(err){
						done(err,null);
						return;
					}
					
					instance.io.sockets.emit("SHARE_VALUE_UPDAE_"+eachShare.userId,obj);
					done(null,true);
				});
			},function(err,res){
				if(err){
					console.log('----error while updating share value--',err);
					return
				}
				setTimeout(updateShareValue,3*1000);
				console.log("shares updated successfully--")
			});
		});

		function getRandomValue(){
			return Math.floor(Math.random() * 300) + 1;
		}
	}

	this.initialise = initialise;
	this.getAllShares = getAllShares;
}