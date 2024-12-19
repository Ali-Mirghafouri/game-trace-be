// server.js
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const MongoStore = require("connect-mongo");
const steamRoutes = require("./routes/steamRoutes");
const username = encodeURIComponent(process.env.mangoUser);
const password = encodeURIComponent(process.env.password);
const uri = `mongodb+srv://${username}:${password}@cluster0gametrace.9vcje.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0GameTrace`;
const app = express();
const port = process.env.PORT || 4000;
const Backend_URl = process.env.BACKEND_URL;
const App_URl = process.env.APP_URL;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Session middleware setup
app.set("trust proxy", true);
app.use(
  session({
    secret: process.env.secret, // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      collectionName: "sessions", // The collection where session data will be stored
    }),
    name: "GameTraceCookie",
    cookie: {
      sameSite: "none",
      secure: true, // Cookies only sent over HTTPS
      httpOnly: true, // Prevent access via JavaScript
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(
  cors({
    origin: App_URl, // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent
  })
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Configure the Steam strategy for Passport
passport.use(
  new SteamStrategy(
    {
      returnURL: Backend_URl + "/auth/steam/return",
      realm: Backend_URl,
      apiKey: STEAM_API_KEY, // Replace with your Steam API key
    },
    (identifier, profile, done) => {
      process.nextTick(() => {
        profile.identifier = identifier;
        return done(null, profile);
      });
    }
  )
);

app.use("/", steamRoutes);
// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
