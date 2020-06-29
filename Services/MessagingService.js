module.exports = function MessagingService(instance){

	var self = this,
		mongoService = null,
		ObjectID = require('mongodb').ObjectID;

	function initialise(cb) {
		instance.getService("MongoDBService",(err,mongo)=>{
			if(err){
				cb(err,null);
				return;
			}
			mongoService = mongo;
			cb(null,true);
		});
	}

	function getAllUsers(userId,cb){
		
		mongoService.find("User",{},{"password":false},(err,allUsers)=>{
			if(err){
				cb(err,null);
				return;
			}
			for(var key in allUsers){
				if(allUsers[key]._id == userId){
					delete allUsers[key];
					break;
				}
			}
			var s =  allUsers.filter(function(each){
					return each
			});
			// console.log('--------',s)
			cb(null,s);
		});
	}

	function getUserMessage(info,cb){
		var query = {"$or":[{user1 :info.userId,user2: info.clientId},{user1 :info.clientId,user2: info.userId}]}
		mongoService.find("Chat",query,{},(err,userMsg)=>{
			if(err){
				console.log("error while getting usermessage--",err);
				cb(err,null);
				return;
			}
			cb(null,userMsg);
		});
	}

	function sendMessageToClient(messageData){
		var query = {user1 :messageData.userId,user2: messageData.to};
		var obj = {};
		obj.msg 	= messageData.msg;
		obj.userId 	= messageData.userId;
		obj.timestamp 	= new Date();
		// console.log('-------userMap-',messageData);
		// console.log('-------userMap-',instance.userMap);
		// var socketId = instance.userMap[messageData.to].socketId; 
		checkChatExist(messageData,(err,res)=>{
			if(err){
				return;
			}
			if(res && res._id){
				pushChatInDB(res._id);
			}
			else{
				upsertChatinDB();
			}
		})

		function pushChatInDB(chatId){
			console.log('-----pushChatInDB--------')
			mongoService.update("Chat",{"_id":ObjectID(chatId)},{$push:{"msgs":obj}},{},(err,res)=>{
				if(err){
					return;
				}
				instance.io.sockets.emit("MSG_SENT_TO_CLIENT_"+messageData.to,obj)
			});
		}

		function upsertChatinDB(){
			console.log('-----upsertChatinDB--------');

			mongoService.update("Chat",query,{$push:{"msgs":obj}},{upsert:true},(err,res)=>{
				if (err) return;
				instance.io.sockets.emit("MSG_SENT_TO_CLIENT_"+messageData.to,obj)
			});
		}
	}

	function checkChatExist(messageData,cb){
		var query = {"$or":[{user1 :messageData.userId,user2: messageData.to},{user1 :messageData.to,user2: messageData.userId}]}
		mongoService.findOne("Chat",query,{},(err,res)=>{
			// console.log('-------checkChatExist-------',res)
			if(err){
				cb(err,null);
				return;
			}
			
			cb(null,res) ;
			});
	}

	this.initialise 	= initialise;
	this.getAllUsers 	= getAllUsers;
	this.getUserMessage = getUserMessage;
	this.sendMessageToClient  = sendMessageToClient;
}