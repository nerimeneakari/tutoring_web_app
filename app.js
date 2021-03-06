require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");
const passportSetup = require("./config/passport/passport-setup.js");
const nodemailer = require("nodemailer");
const accountSid = "AC6daac4567180e9bcd07e51ec01c29676";
const authToken = "1250540d1e7e24d864cbef283363b2d8";
const client = require("twilio")(accountSid, authToken);
// const mdbootstrap = require("mdbootstrap");

mongoose
  .connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true }
  )
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true
  })
);

hbs.registerPartials(path.join(__dirname, "views", "partials"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));
// enables our app to keep track of sessions
app.use(
  session({
    // "secret"
    secret: "secret should be different for every app",
    // "saveUninitialized" and "resave" are here just to avoid messages
    saveUninitialized: true,
    resave: true,
    // use connect-mongo to store session information inside mongoDB
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

// MUST come after "app.use(session())"
passportSetup(app);

// enables flash messages in our routes with "req.flash()"
app.use(flash());

app.use((req, res, next) => {
  // make flash messages accessible inside hbs files as "messages"
  res.locals.messages = req.flash();
  // you need this or your app won't work
  next();
});

// default value for title local
app.locals.title = "Tutoring Web App";

const index = require("./routes/index");
app.use("/", index);

const authRouter = require("./routes/auth-router.js");
app.use("/", authRouter);

const noteRouter = require("./routes/note-router.js");
app.use("/", noteRouter);

module.exports = app;
