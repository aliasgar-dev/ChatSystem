const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
var ObjectID = require("mongodb").ObjectID
 // var passport = require("passport");
const localStraytegy = require("passport-local").Strategy;

module.exports =(instance,passport)=>{

	var jwtSecret = instance.getSharedData("appConfig").jwtSecret;
	
	const cookieExtractor = (req)=> {
	  var token = null;
	  if (req && req.cookies) token = req.cookies['token'];
	 
	  return token;
	};

	passport.use(new JWTStrategy({
  		jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor, ExtractJWT.fromAuthHeaderAsBearerToken()]), // check token in cookie
	    secretOrKey   : jwtSecret
	    }, (jwtPayload, done) =>{
	    	console.log('------jwt---')
		   	instance.getService("MongoDBService",(err,mongoService)=>{
		        if(err){
		            console.log('-----error while getting mongoService-',err);
		            done(err,null);
		            return
		        }
		        
		        mongoService.findOne("User",{_id:ObjectID(jwtPayload._id)},{},(err,user)=>{
		            if(err){
		                console.log('----error while getting userinfo',err);
		                cb(err,null);
		                return;
		            }
		           
		            if(user){

		                done(null,user);
		                return;
		            }
		            else {
		                return done(null, false);
		            }
		        });
		    });
	   	}
	));

	passport.use(
        new localStraytegy(function (username, password, done) {
        	console.log('--------localStraytegy-')
          		instance.getService("MongoDBService",(err,mongoService)=>{
	            if (err) {
	              throw err;
	            }
	            mongoService.findOne("User",{username:username, password: password},{},(err,user)=>{
		            if(err){
		                console.log('----error while getting userinfo',err);
		                cb(err,null);
		                return;
		            }
		            console.log('--user  LCAL---',user)
		            if(user){
		            	
		                done(null,user);
		                return;
		            }
		            else {
		                return done(null, false);
		            }
		      
	            });
          	});
        })
    );
}