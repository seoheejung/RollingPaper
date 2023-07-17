const express = require('express'); 
const app = express();
const MongoClient = require('mongodb').MongoClient; 
require("dotenv").config();

app.use(express.urlencoded({extended: true})); 
app.set('view engine', 'ejs'); 
app.use('/public', express.static('public'));

// HTML에서 PUT 요청을 사용하기 위해 선언
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// 로그인 & 세션생성을 도와줄 라이브러리 선언
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// 요청과 응답 사이에 뭔가 실행시키는 코드인 미들웨어 선언
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 


// MongoDB 연결하기
let db;
MongoClient.connect(process.env.MONGODB, function(err, client){
    if(err) { return console.log(err);  }
    app.listen(process.env.PORT, function () {
        console.log(`Server started at ${process.env.apiURL}`);
    });
    db = client.db('rollingpaper');
});

app.get('/', (req, res) => { 
    res.render('index.ejs');
});

// 로그인
app.get('/login', checkLogin, (req, res) => { 
    res.render('login.ejs');
});

// 회원가입
app.get('/join', (req, res) => { 
    res.render('join.ejs');
});

// 받는 사람의 주소가 없을 경우 메인페이지로 이동
app.get('/write', (req, res) => {
    res.send("<script>alert('잘못된 경로입니다.'); location.href='/';</script>");
});

// 로그인 후 입장 가능한 마이페이지 만들기
app.get('/mypage', checkMypage, function (req, res) {
    db.collection('message').find({memberID : req.user.result.memberID}).toArray(function (err, data) {
        res.render('mypage.ejs', {user : req.user.result, lists:data});
    });
})

// 해당 pageID가 존재할 경우 이동
app.get('/:id', (req, res) => {
    db.collection('member').findOne({memberID : req.params.id}, function (err, data) {
        if(!data) {return res.send("<script>alert('해당 사용자가 없습니다'); location.href='/';</script>") };
        console.log(data);
        res.render('write.ejs', {user : data});
    });
});

// 롤링페이퍼 작성하기
app.post('/add', (req, res) => {
    db.collection('message').insertOne({memberID: req.body.memberID, content : req.body.content, sender : req.body.sender}, function(){
        res.send("<script>alert('롤링페이퍼를 전달했습니다.');location.href='/';</script>");
    });
});

// 회원가입
app.post('/join', (req, res) => {
    // pageID 랜덤 생성
    const memberID = (Math.floor(Math.random() * 1000000000)).toString(36);
    db.collection('member').insertOne({email: req.body.email, password : req.body.pw, nickName : req.body.nickname, memberID : memberID}, function(){
        res.send("<script>alert('회원가입이 완료되었습니다.');location.href='/login';</script>");
    });
});

// AJAX로 가져온 emailCheck 요청 처리
app.post('/emailCheck', function (req, res) {
    db.collection('member').findOne({email : req.body.email}, function (err, result) {
        if (err) { return next(err); }
        // 요청 성공 응답 코드 보내기
        if(!result) {
            res.send({message: "사용할 수 있는 이메일입니다.", check:'1'});
        } else {
            res.send({message: "이미 존재하는 이메일입니다."});
        }
    });
});

// post 요청으로 온 데이터로 로그인하기 (함수 오버라이딩)
app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.send("<script>alert('" + info.message + "'); location.href='/login';</script>"); }

    req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/mypage');
    });
    })(req, res, next);
});

// 로컬 방식 인증
passport.use(new LocalStrategy({
    usernameField: 'email', // 사용자가 제출한 아이디 위치 (form에 있는 input name)
    passwordField: 'pw', // 사용자가 제출한 비밀번호 위치
    session: true, // 세션 사용 여부
    passReqToCallback: false, // 아이디/비번 말고 다른 정보 검사 필요 여부
}, function (inputEMAIL, inputPW, done) { 
    db.collection('member').findOne({ email: inputEMAIL }, function (err, result) {
        if (err) { return done(err) };
        // 아이디 검사 후 비밀번호 검사
        if (!result) return done(null, false, { message: '존재하지 않는 이메일입니다' });
        if (inputPW == result.password) {
            return done(null, result);
        } else {
            return done(null, false, { message: '잘못된 비밀번호입니다.' });
            // done(err, 성공 시 사용자 DB 데이터, 에러메세지)
        }
    })
}));

// 로그인 후 세션 저장 필요
// serializeUser: 로그인 성공 시 호출하는 세션을 저장시키는 함수
passport.serializeUser(function (user, done) { 
    done(null, user.email);
    // deserializeUser의 userID로 전송
});

// 세션 데이터를 가진 사람을 DB에서 찾을 때 사용되는 함수
passport.deserializeUser(function (userEmail, done) { 
    // DB에서 user.id로 회원을 찾은 뒤 정보를 {} 에 넣음
    db.collection('member').findOne({email : userEmail}, function (err, result) {
        done(null, {result});
    });
}); 

// 로그인 여부 확인 미들웨어 생성
function checkMypage (req, res, next) {
    if (req.user) {
        next();
    } else {
        res.send("<script>alert('로그인이 필요합니다.'); location.href='/login';</script>");
    }
}

function checkLogin (req, res, next) {
    if (req.user) {
        res.redirect('/mypage');
    } else {
        next();
    }
}
