const process = require("process");
const path = require("path");
const fs = require('fs');
//const path = require('path');
//const filePath = path.resolve(__dirname, '..', 'db.json');
//const data = fs.readFileSync(filePath, "utf-8");
//const db = JSON.parse(data);
const db = JSON.parse(fs.readFileSync((path.resolve(__dirname,"db.json")), 'UTF-8'))
const jsonServer = require('json-server');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 9000;

server.use(cookieParser());
server.use(express.json());
server.use(cors({
  origin: 'https://dreamer-12ob3ubtg-asamis-projects.vercel.app', //アクセス許可するオリジン
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, //レスポンスヘッダーにAccess-Control-Allow-Credentials追加
  optionsSuccessStatus: 200 //レスポンスstatusを200に設定
}))
//const bcrypt = require("npm ");
//const jwt = require("jsonwebtoken");
const JWT_SECRET = "jwt_json_server";
const EXPIRATION = "1h";

server.post('/auth/signin', (req, res) => {
  const username = req.body['username']
  const password = req.body['password']
  try {
    if (!username || !password) {
      return res.status(400).json({ message: "ユーザー名とパスワードを入力してください" });
    }

    const user = db.users.find((user) => user.username === username);

    if (!user) {
      return res.status(400).json({ message: "入力されたユーザー名は存在しないようです" });
    }

    const isMatch = db.users.find((user) => user.password === password);

    if (!isMatch) {
      return res.status(400).json({ message: "パスワードが間違っています" });
    }
    /*
    const token = jwt.sign({ username }, JWT_SECRET, {
      expiresIn: EXPIRATION,
    });
*/
    res.cookie('session', `${username}`, {
      maxAge: 3600 * 1000,
      httpOnly: true,
    });
    res.status(200).json(user);
  /*
    res.status(200).json({
      message: "User is LogIn Successfully",
      ...user,
      newToken: token,
    });
  */
  } catch (error) {
    res.status(400).json({message: error.message});
  }
});


server.post('/auth/register', (req, res) => {

  const username = req.body['username']
  const password = req.body['password']

  try {
    // Check input all fields
    if (!username || !password) {
      return res.status(400).json({ message: "新規のユーザー名とパスワードを入力してください" });
    }

        const user = db.users.find((user) => user.username === username);
    
        if (user) {
          return res.status(400).json({ message: "入力されたユーザー名は既に存在しています。別のものに変更してください" });
        }

        const userId = db.users.length + 1;

        let newData = {
          "id": userId,
          "username": username,
          "password": password,
          "createdAt": new Date(),
          "numberOfStars": 0,
        };
        /*
        db.users.push(newData);
      
        let newData2 = JSON.stringify(db,null,2);
        fs.writeFile('db.json',newData2, err => {
          if(err) throw err; 
          console.log("新しいデータが追加されました"); 
        });
        */
        res.cookie('session', `${username}`, { maxAge: 3600 * 1000,httpOnly: true });
        res.status(200).json(newData);
      } catch (error) {
        res.status(400).json({message: error.message});
      }
});

server.post('/auth/signout', (req, res) => {
  if(req.cookies.session === "invalid") {
    res.status(400).json({message: "ログインしてください！"});
  } else {
    res.cookie("session","invalid", {  maxAge: 0,httpOnly: true });
    res.status(200).json({ message: 'ログアウトに成功しました！' });
  }
  /*
  res.cookie('token', '', {
    maxAge: 0,
    httpOnly: true,
  });
  res.status(200).json({
    message: 'Sign out successfully',
  });
  */
});

server.delete('/rewards/deleteReward',express.json(),(req,res)=>{
  const id = req.body.id
  db.rewards=db.rewards.filter((e)=>e.id !== Number(id));
res.send(db.rewards);
})

server.delete('/todos/deleteTodo',express.json(),(req,res)=>{
  const id = req.body.id
  db.todos=db.todos.filter((e)=>e.id !== Number(id));
res.send(db.todos);
})

server.get('/users/me', (req, res) => {
  if (!req.cookies.session || req.cookies.session === "invalid") {
    return res.status(401).json({
      message: 'ログインしていません！',
    });
  } else {
    const authUser = db.users.find((user) => user.username === req.cookies.session);
    res.status(200).json(authUser);
  }
});
/*
server.get('/rewards', (req, res) => {
  db.rewards = db.rewards.filter((r) => r.owner.username === req.cookies.session);
    res.status(200).json(db.rewards);
});
*/

server.use(middlewares);
server.use(router);
server.listen(port, (err) => {
  if (err) {
    console.error(err);
    process.exit();
    return;
  }
  console.log("Start listening...");
  console.log('http://localhost:' + port);
});