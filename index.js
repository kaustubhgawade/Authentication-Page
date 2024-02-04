const express = require("express");
const app = express();
const port = 8080;

const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const User = require("./models/user-authentication.js");

app.use(express.static(path.join(__dirname, "/public/css")));
app.use(express.static(path.join(__dirname, "/public/js")));
app.use(express.static(path.join(__dirname, "/public/imgs")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

function authenticateUser(req, res, next) {
  if (req.session.username) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/", (req, res) => {
  res.send("You contacted root path");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  try {
    const userData = await User.findOne({ email: email });
    if (userData !== null) {
      let dbSavedPassword = userData.password;
      let username = userData.username;
      async function checkUser(password, dbSavedPassword) {
        const match = await bcrypt.compare(password, dbSavedPassword);
        if (match) {
          req.session.username = username;
          res.redirect("/home");
        } else {
          res.send("Password entered is wrong");
        }
      }
      checkUser(password, dbSavedPassword);
    } else {
      res.send("Email entered is wrong");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post("/signup", async (req, res) => {
  let { username, email, password, cpassword } = req.body;
  let hash = "";
  const userData = await User.findOne({ email: email });
  if (userData === null) {
    if (password === cpassword) {
      let saltRounds = 10;
      hash = bcrypt.hashSync(password, saltRounds);

      let user = new User({
        username: username,
        email: email,
        password: hash,
      });
      user.save();

      req.session.username = username;

      res.redirect("/home");
    } else {
      res.send("Password does not match. Try Again!");
    }
  } else {
    res.send("Entered email already exists");
  }
});

app.get("/home", authenticateUser, (req, res) => {
  const username = req.session.username;
  res.render("home", { username });
});

app.listen(port, () => {
  console.log(`Server is running on port, ${port}`);
});
