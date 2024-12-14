// server.js
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const MongoStore = require("connect-mongo");
const steamRoutes = require("./routes/steamRoutes");
const epicRoutes = require("./routes/epicRoutes");
const username = encodeURIComponent("alimirghafouri");
const password = encodeURIComponent("Ali!22423001");
const uri = `mongodb+srv://${username}:${password}@cluster0gametrace.9vcje.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0GameTrace`;
const app = express();
const port = process.env.PORT || 4000;
const Backend_URl = "http://localhost:4000";
const App_URl = "http://localhost:3000";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Session middleware setup
// app.set("trust proxy", true);
app.use(
  session({
    secret: "TMkYE@I9BUe/TK`'s$4/+ZiR'T%i~874,GoJ&HNQl[c?bfaphx-l?k6o~phh6Z", // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      collectionName: "sessions", // The collection where session data will be stored
    }),
    name: "GameTraceCookie",
    cookie: {
      // sameSite: "none",
      secure: false, // Cookies only sent over HTTPS
      httpOnly: false, // Prevent access via JavaScript
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
app.use("/", epicRoutes);
// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
