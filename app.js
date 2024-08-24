const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");
const passport = require("passport");
const Student = require("./model/studentModel");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("./controllers/passportConfig")(passport);

dotenv.config();

const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: false }));

app.use("/admin", require("./routes/adminRoutes"));
app.use("/coordinator", require("./routes/coordinatorRoutes"));
app.use("/student", require("./routes/studentRoutes"));
app.use("/items", require("./routes/itemRoutes"));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Student.findById(id);
    done(null, user);
  } catch (err) {
    console.error(err);
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// app.get(
//   "/auth/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: "http://localhost:3000",
//     failureMessage: true,
//   }),
//   async (req, res) => {
//     res.redirect("http://localhost:3000/student/dashboard");
//   }
// );

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    const token = jwt.sign(
      { user: req.user },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
      // (err, token) => res.cookie("jwtokenStudent", token).json({ token })
    );
    // console.log(token);
    // console.log(req.user);
    res.cookie("jwtokenStudent", token, {
      expires: new Date(Date.now() + 86400000),
      httpOnly: true,
    });
    res.redirect(`${process.env.CLIENT_URL}/student/dashboard`);
  }
);

app.post("/google-auth", passport.authenticate("google-token"), (req, res) => {
  // the user is authenticated and a session is created
  res.send(req.user);
});

app.listen(port, () => console.log(`Server started on port ${port}`));

connectDB();
