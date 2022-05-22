//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var _ = require("lodash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { redirect } = require("express/lib/response");
const app = express();

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("GazozUniversitesi"));

const fifteenMinutes = 1000 * 60 * 15;
app.use(
  session({
    secret: "mylittlesecretforsecret",
    resave: false,
    cookie: { maxAge: fifteenMinutes },
    saveUninitialized: false,
  })
);

mongoose.connect("mongodb://localhost:27017/universityDB");

const lessonSchema = new mongoose.Schema({
  lessonName: String,
  grade: Number,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  firstName: String,
  lastName: String,
  departmant: String,
  isAdmin: Boolean,
  grades: [lessonSchema],
});

const Lesson = new mongoose.model("Lesson", lessonSchema);
const User = new mongoose.model("User", userSchema);

////////////////----GET REQUESTS----///////////////

app.get("/", function (req, res) {
  res.render("GazozUniversitesi/index");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  if (req.session.mySession === "adminSession") {
    res.render("register");
  } else {
    res.redirect("/");
  }
});
const myStudentArray = [];

app.get("/showAllStu", function (req, res) {

  if (req.session.mySession === "adminSession") {
    User.find({ isAdmin: false }, function (err, foundUsers) {
      foundUsers.forEach((element) => {
        var myObj = {
          isim: element.firstName,
          soyad: element.lastName,
          bolum: element.departmant,
        };

        myStudentArray.push(myObj);
      });
    });
    res.render("showAllStu", { startingContent: myStudentArray });
    
  } else {
    res.redirect("/");
  }
});

app.get("/adminPanel", function (req, res) {
  if (req.session.mySession === "adminSession") {
    res.render("adminPanel");
  } else {
    res.redirect("/");
  }
});
app.get("/studentPanel", function (req, res) {
  if (req.session.mySession === "stuSession") {
    res.render("studentPanel");
  } else {
    res.redirect("/");
  }
});
app.get("/gradeInfo", function (req, res) {
  if (req.session.mySession === "stuSession") {
    res.render("gradeInfo");
  } else {
    res.redirect("/");
  }
});
app.get("/stuInfo", function (req, res) {
  if (req.session.mySession === "stuSession") {
    res.render("stuInfo");
  } else {
    res.redirect("/");
  }
});
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

app.get("/GazozUniversitesi/:x/:y", function (req, res) {
  res.render("GazozUniversitesi/" + req.params.x + "/" + req.params.y);
});

app.get("/GazozUniversitesi/:x", function (req, res) {
  res.render("GazozUniversitesi/" + req.params.x);
});

////////////////----POST REQUESTS----///////////////
app.post("/register", function (req, res) {
  const newStudent = new User({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.fName,
    lastName: req.body.lName,
    isAdmin: false,
    departmant: req.body.ddBolumSec,
  });
  newStudent.save();
  res.redirect("/register");
});

app.post("/login", function (req, res) {
  User.findOne(
    {
      username: req.body.username,
    },
    function (err, foundUser) {
      if (!err && foundUser) {
        if (foundUser.password === req.body.password) {
          if (foundUser.isAdmin === true) {
            req.session.mySession = "adminSession";
            res.render("adminPanel");
          } else {
            req.session.mySession = "stuSession";
            res.render("studentPanel");
          }
        } else {
          res.redirect("/GazozUniversitesi/Aksis");
        }
      } else {
        console.log(err);
        res.redirect("/GazozUniversitesi/Aksis");
      }
    }
  );
});

/////----//////////
app.listen(3000, function () {
  console.log(`App listening on port 3000`);
});
