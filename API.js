module.exports = function API(passport,app){

	var bodyParser   = require("body-parser");
	var express 	 = require('express')
	var exphbs       = require("express-handlebars");
	var flash        = require('connect-flash');
	var cookieParser = require('cookie-parser');
	var session      = require('express-session'); 
	var cors 		 = require ('cors')
	
	app.use(bodyParser.urlencoded({extended:true}));
	app.use(bodyParser.json());
	app.use(cookieParser());
	app.use(cors())

	app.engine("handlebars", exphbs({defaultLayout: "main"}));
	app.set("view engine","handlebars");
	app.use(express.static("public"));

	app.use(session({
    	key: 'user_sid',
    	secret: 'goN6DJJC6E287cC77kkdYuNuAyWnz7Q3iZj8',
    	resave: false,
    	saveUninitialized: false,
    	cookie: {
        	expires: 60*1000*24
    	}
	}));

	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash());
}
