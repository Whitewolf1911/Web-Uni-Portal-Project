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
    secret: process.env.SECRET,
    resave: false,
    cookie: { maxAge: fifteenMinutes },
    saveUninitialized: false,
  })
);

// Variable for getting student info from db
var stuID = "";

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
const User = mongoose.model("User", userSchema);

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

app.get("/showAllStu", function (req, res) {
  if (req.session.mySession === "adminSession") {
    User.find({ isAdmin: false }, function (err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        res.render("showAllStu", { startingContent: foundUsers });
      }
    });
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

app.get("/addGradeInfo", function (req, res) {
  if (req.session.mySession === "adminSession") {
    User.find({ isAdmin: false }, function (err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        res.render("addGradeInfo", { allStudents: foundUsers });
      }
    });
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
    User.findOne({ username: stuID }, function (err, foundStudent) {
      if (err) {
        console.log(err);
      } else {
        res.render("gradeInfo", { stuGrades: foundStudent.grades });
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/stuInfo", function (req, res) {
  if (req.session.mySession === "stuSession") {
    User.findOne({ username: stuID }, function (err, foundStudent) {
      if (err) {
        console.log(err);
      } else {
        res.render("stuInfo", { studentInfo: foundStudent });
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/logout", function (req, res) {
  stuID = "";
  req.session.destroy();
  res.redirect("/");
});

app.get("/GazozUniversitesi/:x/:y", function (req, res) {
  res.render("GazozUniversitesi/" + req.params.x + "/" + req.params.y);
});
app.get("/GazozUniversitesi/:x/:y/:z", function (req, res) {
  res.render(
    "GazozUniversitesi/" +
      req.params.x +
      "/" +
      req.params.y +
      "/" +
      req.params.z
  );
});

app.get("/GazozUniversitesi/:x", function (req, res) {
  res.render("GazozUniversitesi/" + req.params.x);
});

////////////////----POST REQUESTS----///////////////
app.post("/register", function (req, res) {
  if (req.session.mySession === "adminSession") {
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
  }
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
            stuID = foundUser.username;
            console.log(stuID);
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

app.post("/addGradeInfo", function (req, res) {
  if (req.session.mySession === "adminSession") {
    const newGrade = new Lesson({
      lessonName: req.body.ddDersSec,
      grade: req.body.grade,
    });
    newGrade.save(function () {});

    User.findOneAndUpdate(
      { username: req.body.ddOgrenciSec },
      { $push: { grades: newGrade } },
      function (err) {
        if (err) {
          console.log(err);
        } else {
          res.render("success");
        }
      }
    );
  } else {
    //unauthorized
    res.redirect("/");
  }
});

/////----//////////
app.listen(3000, function () {
  console.log(`App listening on port 3000`);
});
