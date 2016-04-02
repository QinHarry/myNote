var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var crypto = require("crypto");
var session = require('express-session');
var moment = require('moment');

var checkLogin = require('./lib/checkLogin.js');

var mongoose = require('mongoose');
var models = require('./models/models');

var User = models.User;
var Note = models.Note;

mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error',console.error.bind(console,'db connect fail'));



var app = express();

//建立session模型
app.use(session({
    secret:'1234',
    name:'mynote',
    cookie:{maxAge:1000*60*20},
    resave:false,
    saveUninitialized:true
}));

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(express.static(path.join(__dirname,'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',checkLogin.noLogin);
app.get('/',function(req,res){
    Note.count({author:req.session.user.username}).exec(function(err,total){
        if(err){
            console.log('err');
            return res.redirect('/');
        }
        Note.find({author:req.session.user.username})
            .limit(5).skip(0).exec(function(err,allNotes){
                if(err){
                    console.log('err');
                    return res.redirect('/');
                }
                var p_count = Math.ceil(total/5);
                console.log(p_count);
                res.render('index',{
                    user:req.session.user,
                    title:'首页',
                    notes:allNotes,
                    p:1,
                    p_count:p_count
                });
                console.log(p_count);
            });
    });
});
app.get('/',checkLogin.noLogin);
app.get('/list/:p',function(req,res){
    Note.find({author:req.session.user.username})
        .limit(5).skip(5*(req.param.p-1)).exec(function(err,allNotes){
            if(err){
                console.log('err');
                return res.redirect('/');
            }
            var index_count = Note.find({author:req.session.user.username})
                .count().exec(function(err,allNotes){
                    if(err){
                        console.log('err');
                        return res.redirect('/');
                    }
                });
            res.render('index',{
                user:req.session.user,
                title:'列表',
                notes:allNotes,
                p:req.param.p,
                p_count:Math.ceil(index_count/5)
            });
        });
});

app.get('/register',checkLogin.logined);
app.get('/register',function(req,res){
    console.log('注册! ');
    res.render('register',{
        user:req.session.user,
        title:'register',
        registerErr:req.session.registerErr
    });
});

app.post('/register',function(req,res){
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;

    if(username.trim().length == 0){
        console.log('The username is empty');
        return res.redirect('register');
    }

    if(password.trim().length == 0 || passwordRepeat.trim().length == 0){
        console.log('The password is empty');
        return res.redirect('/register');
    }

    if(password != passwordRepeat){
        console.log('password is disaccord');
        return res.redirect('/register');
    }

    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err);
            return res.redirect('/register');
        }

        if(user){
            console.log('The usename is existed');
            req.session.registerErr = "The username is existed";
            return res.redirect('/register');
        }

        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');

        var newUser = new User({
            username:username,
            password:md5password
        });


        newUser.save(function(err,doc){
            if(err){
                console.log(err);
                return res.redirect('/register');
            }
            console.log('register successed');
            req.session.registerErr = null;
            newUser.password = null;
            delete newUser.password;
            req.session.user = newUser;
            return res.redirect('/');
        });
    });
});

app.get('/login',checkLogin.logined);
app.get('/login',function(req,res){
    console.log('sign in ');
    res.render('login',{
        user:req.session.user,
        title:'sign in',
        loginErr:req.session.loginErr
    });
});

app.post('/login',function(req,res){
    var username = req.body.username,
        password = req.body.password;

    User.findOne({username:username},function(err,user){
        if(err){
            console.log(err);
            return res.redirect('/login');
        }

        if(!user){
            console.log('The user is not exist');
            req.session.loginErr = 'The user is not exist';
            return res.redirect('/login');
        }

        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');
        //TODO Why !==
        if(user.password !== md5password){
            console.log('password is error');
            req.session.loginErr = 'password is error';
            return res.redirect('/login');
        }

        console.log('login successed');
        user.password = null;
        delete user.password;
        req.session.user = user;
        req.session.loginErr = null;
        return res.redirect('/');
    });
});

app.get('/quit',checkLogin.noLogin);
app.get('/quit',function(req,res){
    req.session.user = null;
    console.log('quit! ');
    return res.redirect('/login');
});

app.get('/post',checkLogin.noLogin);
app.get('/post',function(req,res){
    console.log('post!');
    res.render('post',{
        user:req.session.user,
        title:'post'
    });
});

app.post('/post',function(req,res){
    var note = new Note({
        title:req.body.title,
        author:req.session.user.username,
        tag:req.body.tag,
        content:req.body.content
    });
    note.save(function(err,doc){
        if(err){
            console.log(err);
            return res.redirect('/post');
        }
        console.log('Post successed');
        return res.redirect('/');
    });
});

app.get('/detail/:_id',checkLogin.noLogin);
app.get('/detail/:_id',function(req,res){
    console.log('check the note');
    Note.findOne({_id:req.params._id})
        .exec(function(err,art){
            if(err){
                console.log(err);
                return res.redirect('/');
            }
            if(art){
                res.render('detail',{
                    user:req.session.user,
                    title:'check the note',
                    art:art,
                    moment:moment
                });
            }
        });

});

app.get('*',function(req,res){
    console.log('404');
    res.render('404',{
        title:'404'
    });
});

app.listen(3000,function(req,res){
    console.log('The port is 3000 and app is running');
});