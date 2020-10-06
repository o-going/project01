const express = require('express');
const path = require('path');
const url = require('url');
const fs = require('fs');
const router = express.Router();

// sequelize
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = new Sequelize('first', 'o_going', 'qawsedrf', {
  host: 'localhost',
  dialect: 'mysql'
});

const usersTable = sequelize.define('users', {
  _id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(45),
    allowNull: false,
    primaryKey: false
  },
  email: {
    type: DataTypes.STRING(45),
    allowNull: false,
    primaryKey: true
  },
  password: {
    type: DataTypes.STRING(256),
    allowNull: false
  },
}, {
  tableName:'users',
  timestamps: false,
});
sequelize.sync();

router.get('/sign_up', (req, res) => {
  res.render('sign_up');
});

router.post('/sign_up', async (req, res) => {
  let body = req.body;    // post로 하면 무조건 req.body에 form에 input type으로 지정해 줬던 모든 내용들이 들어옴.
  // console.log(body);
  // let newUser = { // 새로운 사용자를 내가 나중에 읽을 수 있는 어딘가에 사용자의 정보를 저장 (객체 형태로 저장)
  //   name: body.name,
  //   email: body.email,
  //   password: body.password
  // }

  // DB 연결 체크
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch(err) {
    console.error('Unable to connect to the database:', err);
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/sign_up";</script>');
    return;
  }

  // new items
  try {
    await usersTable.create({
      name: body.name,
      email: body.email,
      password: body.password
    });
  } catch(err) {
    console.log(err);
    res.send('<script type="text/javascript">alert("회원가입에 실패하셨습니다.");location.href="/sign_up";</script>')
    return;
  }
  res.send('<script type="text/javascript">alert("회원 가입에 성공하셨습니다.");location.href="/";</script>');
});

router.get('/login', (req, res) => {
    res.render('login');
});
router.post('/login', async (req, res) => {
  let body = req.body;   // req.body에 email이랑 psw정보가 들어감.
  console.log(body);
  if (body.email == null || body.password == null) {
    res.send('<script type="text/javascript">alert("잘못된 ID 혹은 비밀번호입니다.");location.href="/users/login"; location.href="/"</script>');
    return;
  }

  // DB 체크
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch(err){
    console.error('Unable to connect to the database:', err);
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/login";</script>');
    return;
  }

  let user;
  try {
    user = await usersTable.findOne({
      where: {
        email: body.email,
        password: body.password
      }
    });

    if(user == null) {
      res.send('<script type="text/javascript">alert("잘못된 email 혹은 비밀번호입니다.");location.href="/login";</script>');
      return;
    }
    else {
      // 세션 설정
      req.session.email = user.email;
      req.session.name = user.name;
      req.session.userId = user._id;
      res.send('<script type="text/javascript">alert("로그인에 성공하셨습니다.");location.href = "./main_feed" </script>');
      return;
    }
  } catch(err){
    res.send('<script type="text/javascript">alert("서버 에러");location.href="/login";</script>');
  }
});

router.get('/profile', (req, res) => {
  if (req.session.email == null) {
    res.render('login');
  } else {
    let user = {
      email: req.session.email,
      name: req.session.name
    }
    res.render('profile', {user: user});
  }
});

const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const feedsTable = sequelize.define('feeds', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    primaryKey: true
  },
  text: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
}, {
  tableName: 'feeds',
  timestamps: true,
});

usersTable.hasMany(feedsTable, {foreignKey: 'userId', sourceKey: '_id'});
feedsTable.belongsTo(usersTable, {foreignKey: 'userId', targetKey: '_id'}); // 이거 박사님께 여쭤보기
sequelize.sync()

router.post('/upload_feed', async(req, res) => {
  let upload = multer({ storage: storage }).single('file');
  try{
    upload(req, res, async function(err){
      if(err) {
        res.send('<script type="text/javascript">alert("글쓰기 실패");location.href="/main_feed";</script>');
      }
      else if (!req.file) {
        res.send('<script type="text/javascript">alert("글쓰기 실패");location.href="/main_feed";</script>');
      }
      else {
        try {
          await sequelize.authenticate();
          console.log('Connection has been established successfully.');
        } catch(err) {
          console.error('Unable to connect to the database:', err);
          res.send('<script type="text/javascript">alert("서버 에러");location.href="/sign_up";</script>');
          return;
        }
        console.log(req.body);
        try {
          await feedsTable.create({
            userId: req.session.userId,
            text: req.body.feed,
            image: req.file.path.replace('\\', '/')
          });
        } catch(err) {
          console.log(err);
          res.send('<script type="text/javascript">alert("글쓰기 실패");location.href="/main_feed";</script>');
          return;
        }
        res.send('<script type="text/javascript">alert("글쓰기 성공");location.href="/main_feed";</script>');
      }
    })
  } catch (err) {
    res.send('<script type="text/javascript">alert("글쓰기 실패");location.href="/main_feed";</script>');
  }
})

router.get('/main_feed', async (req, res) => {
    if (req.session.email == null) {
      res.render('login');
    }else {
      try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
      } catch (err) {
        res.send('<script type="text/javascript">alert("서버 에러");location.href="/sign_up";</script>');
        return;
      }
      let user = {
        email: req.session.email,
        name: req.session.name
      }

      let myFeeds;
      try {
        myFeeds = await feedsTable.findAll({
          where: {
            userId: req.session.userId
          }
        });
        myFeedsWithName = await feedsTable.findAll({
          include: [
            {
              model: usersTable,
              required: true
            }
          ],
          where: {
            userId: req.session.userId
          }
        })
        myFeeds.reverse();
        console.log(myFeeds);
        console.log(myFeedsWithName);
        myFeedsWithName.reverse();
        res.render('main_feed', {user: user, feeds: myFeedsWithName});
      } catch (err) {
        console.log(err);
        res.render('main_feed', {user: user, feeds: []});
      }
    }
});

router.get('/', (req, res) => {
  if (req.session.email == null) {
    res.render('login');
  } else {
    let user = {
      email: req.session.email,
      name: req.session.name
    }
    res.render('main_feed', {user: user});
  }
});

module.exports = router;