# 📫RollingPaper Project
## 🚀 기획의도
* 산타파이브팀의 '내 트리를 꾸며줘' 서비스에서 착안
* 회원가입을 하면 나만의 롤링페이퍼 링크가 생성되고 해당 링크를 공유하면 상대방은 가입하지 않아도 롤링페이퍼를 작성할 수 있게 기획

## 📌 프로젝트 기본 정보
* FrontEnd : NodeJS EJS
* BackEnd : NodeJS express
* DB : MongoDB

## 📌 프로젝트 기본 구조
```js
ROLLINGPAPER
    ├ public
    │   └ img
    │   └ main.css
    ├ views  // ejs
    │   ├ index.ejs
    │   ├ join.ejs
    │   ├ login.ejs
    │   └ ...
    ├ app.js
    └ ...
```

## 💡 주요 기능
* 회원가입
* 로그인
* 롤링페이퍼 작성
* 롤링페이퍼 조회

## 💡 MongoDB 설계
1. member Collection
    _id
    email
    password
    nickName
    memberID
2. message Collection
    _id
    memberID
    content
    sender

## 💭 이후 필요 작업
1. app.js 모듈화
2. 비밀번호 암호화