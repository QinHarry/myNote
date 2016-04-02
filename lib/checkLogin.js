
function noLogin(req,res,next){
    if(!req.session.user){
        console.log('Please Sign In');
        return res.redirect('/login');
    }
    next();
}

function logined(req,res,next){
    if(req.session.user){
        console.log('You are already sign in');
        return res.redirect('/');
    }
    next();
}

exports.noLogin = noLogin;
exports.logined = logined;