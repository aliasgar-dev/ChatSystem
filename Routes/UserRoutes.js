var jwt = require("jsonwebtoken");

module.exports = function(instance,app,passport){

    var secret = instance.getSharedData("appConfig").jwtSecret;
    // socket.on("LOGIN",(msg)=>{
    //     console.log('----login is calling')
    // })

    app.get("/",function (req, res,next) {
        var isloggedin = false;
        if(req.cookies.token){
            isloggedin = true;
        }
        console.log('-------isloggedin-----',isloggedin)
        res.render("login",{isloggedin});
    });
 
    app.post('/login',  passport.authenticate('local', {session: false}), (req, res,next)=> {
        
        const token = jwt.sign(req.user, secret,{
            expiresIn: 24 * 60 * 60
        });
        res.cookie('token', token, {maxAge: 24 * 60 * 60, httpOnly: true, secure: false});
        res.append('Set-Cookie', 'token=' + token + ';');
        var isloggedin = true
        var userId = req.user._id
        res.send({ token, isloggedin,userId});
    }); 

    app.get('/logout', (req, res,next)=> {
        req.logout();
        res.clearCookie("token");
        req.session.destroy();
        res.redirect("/");
    });
}