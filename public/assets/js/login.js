
$(document).ready(function(){
	var socket = null;
	var clientId = null;
	$('#login').show();
	$('#SharesPageHldr').hide();
	$('#loginUser').on("click",handleLoginUser);
	$('#logout').on("click",handleLogoutUser);
	$('#sendMessage').on("click",sendMessage);
	$('#getMessage').on("click",handleGetMessage);
	$('#shareDetailTab').on("click",handleShareDetailTab);
	$('#messageData').on('keydown',function(e){
		if(e.which == 13){
			sendMessage()
		}
	})
	// console.log('---socket----',socket)
	
	function getLoginFormData(){
		let obj = {};
		obj.username = $('#username').val();
		obj.password = $('#password').val();
		return obj;
	}

	function handleLoginUser(){
		var loginData = getLoginFormData();
		if(loginData && loginData.username && loginData.password){
			$.ajax({
		      	type: "post",
		      	url: "/login",
		      	dataType: 'json',
		      	data: loginData,
		      	success: function(data) {
		        	console.log('process sucess',data);
		        	console.log('--------- logged in success fully----')
		        	clearLoginForm();
		        	$('#login').hide();
		        	$('#AllTabs').show();
		        	
		        	localStorage.setItem("socket",socket);
		        	localStorage.setItem("userId",data.userId);
		        	localStorage.setItem("token",data.token);
		        	window.location.reload();
		        	// getConnection()
		      	},
		      	error: function(e) {
		        	console.log('login error',e);
		      	},
		    });
		}
		else{
			alert("Please fill all data");
		}
	}

	function handleLogoutUser(){
		$.ajax({
	      	type: "get",
	      	url: "/logout",
	      	success: function(data) {
	        	console.log('logout sucess');
		    	localStorage.setItem("socket",'');
		    	localStorage.setItem("userId",'');
		    	localStorage.setItem("token",'');
		    	window.location.reload()
	      	},
	      	error: function(e) {
	        	console.log('login error',e);
	      	},
	    });
		
	}

	function clearLoginForm(){
		$('#username').val('');
		$('#password').val('');
	}

	function handleGetMessage(){
		$('#messageArea').hide()
		getConnection();
		var userId = localStorage.getItem('userId')
		socket.emit("GETAllUSERS",userId);
	}
	
	function getAllSharesTmpl(){

	  	return `
		  <tr >
		    <td>{{shareName}}</td>
		    <td id="shareValue_{{_id}}">{{currentValue}}</td>
		  </tr>
	  	`;
	}

	function getEmptyTmpl(){

	  	return `
		  <div>{{msg}}</div>
	  	`;
	}

	function getChatUserNametmpl() {
	  return `
	  	<div class="media-body">
            <h6 class="mb-0 d-block" style="color:white;">{{username}}
            <span class="badge badge-indicator badge-success"></span>
            </h6>
        </div>
	  `;
	}

	function gettmpl() {
	  return `
	  	<div class="list-group list-group-chat list-group-flush">
            <div class="media-body d-none d-lg-block" id=user_{{_id}}>
                <div class=" justify-content-between align-items-center">
                    <h6 class="mb-0 chatUserCls" style="color: white;padding: 15px 10px;border-bottom: 2px solid;">{{username}}
                    <span class="badge badge-indicator badge-success"></span>
                    </h6>
                </div>
            </div>
        </div>
	  `;
	}

	function getUsertmpl() {
	  return `
        <div class="row justify-content-end text-right">
            <div class="col-auto">
                <div class="card bg-primary text-white">
                    <div class="card-body p-2">
                        <p class="mb-0">
                            {{msg}}
                        </p>
                        <div>
                            <i class="icon-check text-small"></i>
                            <small class="opacity-60">{{timestamp}}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
	  `;
	}
	function getClienttmpl(){
		return `
	  	<div class="card-body overflow-auto">
            <div class="row justify-content-start">
                <div class="col-auto">
                    <div class="card">
                        <div class="card-body p-2">
                            <p class="mb-0">
                                {{msg}}
                            </p>
                            <div>
                                <small class="opacity-60">{{timestamp}}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
	  `;
	}
	function handleUser(data){
		$('#chatUserName').empty()
		var data = data.data;
		$('#messageArea').show()
		$('#chatUserName').append(renderUserName(data));
		clientId = this.id.split('_')[1];
		var userId = localStorage.getItem('userId')
		getConnection();
		socket.emit("USER_MSG",{"clientId":clientId,"userId":userId});

			
		
	}

	function renderUserName(user){
		var template = Handlebars.compile(getChatUserNametmpl());
	  	var d = template(user);
	  	return d;
	}

	function renderEmptyTmpl(msgInfo){
		var template = Handlebars.compile(getEmptyTmpl());
	  	var d = template(msgInfo);
	  	return d;
	}

	function renderUserMsgs(eachMsgs){
		var template = Handlebars.compile(getUsertmpl());
	  	var d = template(eachMsgs);
	  	return d;
	}

	function renderClientMsgs(eachMsgs){
		var template = Handlebars.compile(getClienttmpl());
	  	var d = template(eachMsgs);
	  	return d;
	}

	function initialiseTmpl(eachData) {
	  var template = Handlebars.compile(gettmpl());
	  var d = template(eachData);
	  return d;
	}

	function getConnection(){
		var token = localStorage.getItem("token");
		if(!socket){
			socket = io("http://ec2-18-221-152-38.us-east-2.compute.amazonaws.com",{transports: ['websocket'],query:{token:token}});
			// socket = io("http://localhost:4000",{transports: ['websocket'],query:{token:token}});
			socket.on('connect',()=>{
				console.log('----connected')
			})
			initialiseSocketEvent();
		}
		return true
	}

	function initialiseSocketEvent(){
		var userId = localStorage.getItem("userId")
		
		socket.on("MSG_SENT_TO_CLIENT_"+userId,(msg)=>{
			msg.timestamp = moment(msg.timestamp).format('llll')
			$("#usersMsgsHldr").append(renderClientMsgs(msg));
		});

		socket.on("ON_USER_MSG_"+userId,(allMsgs)=>{
			console.log('-allMsgs---',allMsgs)
			if(allMsgs && allMsgs.length>0){
				$("#usersMsgsH ldr").empty();
				for (var key in allMsgs) {
					var msgs = allMsgs[key].msgs
					for(var i in msgs){
						msgs[i].timestamp = moment(msgs[i].timestamp).format("llll")
						if(msgs[i].userId == userId){
					    	$("#usersMsgsHldr").append(renderUserMsgs(msgs[i]));
						}
						else{
							$("#usersMsgsHldr").append(renderClientMsgs(msgs[i]));
						}
					}
				}
			}
		});

		socket.on('ALL_SHARES_'+userId,(allShares)=>{
			console.log('---allShares-----',allShares)
			$('#shareDetailHldr').empty()
			if(allShares && allShares.length>0){
				for(var i in allShares){
				    $("#shareDetailHldr").append(renderAllShares(allShares[i]));
				}
			}
			else{
				$("#shareDetailHldr").append(renderEmptyTmpl({msg:"No Shares to list"}));
				
			}
		});

		socket.on("ALLUSERS_"+userId,(allusers)=>{
			if(allusers && allusers.length>0){
				$("#usersHldr").empty();
				for (var key in allusers) {
				    $("#usersHldr").prepend(initialiseTmpl(allusers[key]));
				    $('#user_'+allusers[key]._id).on('click',allusers[key],handleUser)
				}
			}
		});

		socket.on("SHARE_VALUE_UPDAE_"+userId,(shareValueObj)=>{
			console.log('---share udate---',shareValueObj);
			$('#shareValue_'+shareValueObj.id).text(shareValueObj.value)	
		});
	}

	function renderAllShares(eachShare){
		var template = Handlebars.compile(getAllSharesTmpl());
	  	var d = template(eachShare);
	  	return d;
	}

	function sendMessage(){
		getConnection()
		var mesageData = $('#messageData').val();
		var userId = localStorage.getItem('userId');
		if(mesageData.length>0 && userId && clientId){
			socket.emit("NEW_MSG",{msg:mesageData,to:clientId,userId:userId});
			$('#messageData').val('');
			let timestamp = moment(new Date()).format('llll')
			var obj = {msg:mesageData,timestamp:timestamp}
			$("#usersMsgsHldr").append(renderUserMsgs(obj));
  			$("#usersMsgsHldr").animate({ scrollTop: $(document).height() }, 100);

		}
		else{
			alert("Please type")
		}
	}

	function handleShareDetailTab(){
		getConnection();
		var userId = localStorage.getItem('userId')
		socket.emit("GET_ALL_SHARES",userId)
	}
});
