module.exports = function MyService(config) {
    console.log('--------initialisin=============',config)
    var self       = this,
    serviceMap     = {},
    socket        = null,
    express        = require("express"),
    fs             = require("fs"),
    path           = require("path"),
    async          = require("async"),
    _              = require("lodash"),
    passport       = require('passport'),
    api            = require(config.apiPath),
    appConfig      = require(config.appConfigPath),
    jwt            = require("jsonwebtoken");
    var app = express();
    self.sharedMap      = {}
    self.userMap = {}
    // const server = require('http').createServer(app)
    const io = require('socket.io');
   


    function initialise(cb) {
        mergeConf()
        initialiseRoutes(cb);
    }
    function mergeConf(){
        appConfig = _.merge({},appConfig, config);
        setSharedData("appConfig", appConfig);
    }

    function ensureAppConf(){
       if( _.isEmpty(self.sharedMap)){
          mergeConf();
       }
    }

    function initialiseRoutes(cb) {
        // io.on('connection', client => {
        //     console.log('-------connection made')
        //     socket = client;
        //     socket.emit("Auth","server connected");
        // });
        api(passport, app);
        require(appConfig.routesPath+"/UserRoutes")(self,app,passport);
        // app.use('/*', passport.authenticate('jwt', {session: false}), p);
        require(appConfig.appPath+"/Authentication/Passport")(self,passport);
        listenPort(cb);
        // cb(null,true)
    }
    function listenPort(cb) {
      
        var server =  app.listen(config.port, ()=> {
                console.log("Listening on localhost:" + config.port);
                cb(null,true)
            });
        self.io = io(server);
        self.io.use((newSocket,next)=>{
            var token=  newSocket.handshake.query.token;
            jwt.verify(token,appConfig.jwtSecret,(err,payload)=>{
                if(err){
                    console.log('----token not verified for socket--',err);
                    return
                }
                if(payload){
                    newSocket.userId =  payload._id;

                    next()
                }
            });
        });


        self.io.on('connection',(newSocket)=>{
            self.socket = newSocket;
            if(!self.userMap[newSocket.userId] || (self.userMap[newSocket.userId] && self.userMap[newSocket.userId].socketId != newSocket.id)){
                self.userMap[newSocket.userId] = {"socketId": self.socket.id,"userId":newSocket.userId};
            }
            self.socket.on('disconnect',()=>{
                console.log('-----disconnect',self.socket.userId)
                if(self.userMap && self.userMap[self.socket.userId]){
                    delete self.userMap[self.socket.userId];
                    // newSocket.removeAllListeners()
                }
            });
            // console.log('---map---',self.userMap)
            self.socket.on('NEW_MSG',(message)=>{
                getService("MessagingService",(err,msgService)=>{
                    if(err){
                        return;
                    }
                    msgService.sendMessageToClient(message);
                });
            });
            self.socket.on("GETAllUSERS",(userId)=>{
                getService("MessagingService",(err,msgService)=>{
                    if(err){
                        return;
                    }
                    msgService.getAllUsers(userId,(err,allUsers)=>{
                        if(err){
                            return;
                        }
                        self.io.sockets.emit("ALLUSERS_"+userId,allUsers);
                    });
                });
            });
            self.socket.on("USER_MSG",(info)=>{
                getService("MessagingService",(err,msgService)=>{
                    if(err){
                        return;
                    }
                    console.log('-info-',info)
                    msgService.getUserMessage(info,(err,userMsg)=>{
                        if(err){
                            return;
                        }
                        // var socketId = self.userMap[info.userId].socketId
                        // console.log('-------socketId-----',socketId)
                        self.socket.emit("ON_USER_MSG_"+info.userId,userMsg);
                    });
                });
            });

            self.socket.on("GET_ALL_SHARES",(userId)=>{
                getService("SharesService",(err,service)=>{
                    if(err){
                        console.log('err in SharesService-',err);
                        return;
                    }
                    service.getAllShares(userId)
                });
            });
        });
       
       
    }

    function getService(serviceName, cb) {
        if (serviceMap && serviceMap[serviceName]) {
            cb(null, serviceMap[serviceName]);
            return;
        }
        initialiseServices(serviceName, cb);
    }

    function initialiseServices(serviceName, cb) {
        if (serviceMap && serviceMap[serviceName]) {
            cb(null, serviceMap[serviceName]);
            return;
        }
        try {
            var s = require(config.servicesPath["servicePath"] +"/" +serviceName);
            var ss = new s(self);
            ensureAppConf();
            ss.initialise((err, res)=> {
                if (err) {
                    console.log("--error while initialising service--", err);

                    cb(err, null);
                    return;
                }
                serviceMap[serviceName] = ss;
                cb(null, ss);
            });
        } catch (e) {
            console.log("--------service not found-------", e, serviceName);
        }
    }
   
    function getSharedData(key) {
        return self.sharedMap[key];
    }

    function setSharedData(key, value) {
        self.sharedMap[key] = value;
    }

    this.getService = getService;
    this.getSharedData     = getSharedData;
    this.initialise     = initialise;
    this.app         = app;
};
