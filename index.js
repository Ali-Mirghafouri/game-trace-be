// server.js

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const axios = require("axios");
const SteamStrategy = require("passport-steam").Strategy;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const MongoStore = require("connect-mongo");

const username = encodeURIComponent("alimirghafouri");
const password = encodeURIComponent("Ali!22423001");
const uri = `mongodb+srv://${username}:${password}@cluster0gametrace.9vcje.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0GameTrace`;
const app = express();
const port = process.env.PORT || 4000;
const STEAM_API_KEY = "32EE6FD86D98585BA5B167FBAB824AAB";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Session middleware setup
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
      sameSite: "none",
      secure: true, // Cookies only sent over HTTPS
      httpOnly: true, // Prevent access via JavaScript
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(
  cors({
    origin: "https://game-trace.netlify.app", // Replace with your frontend URL
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
      returnURL: "https://game-trace-be.onrender.com/auth/steam/return",
      realm: "https://game-trace-be.onrender.com",
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

app.get("/", (req, res) => {
  console.log("Session ID:", req.sessionID);
  console.log("Session Data Before:", req.session);
  console.log("Session Data Before:", req.session.viewCount);

  req.session.viewCount = (req.session.viewCount || 0) + 1;
  req.session.user = "test user";

  console.log("Session Data After:", req.session.viewCount);
  res.send(`You have visited this page ${req.session.viewCount} times.`);
});

app.get("/get", (req, res) => {
  console.log("Session ID:", req.session.id);
  console.log("Session ID:", req.session.user);

  res.send(`You : ${req.session.user} `);
});

// Routes for authentication
app.get("/auth/steam", passport.authenticate("steam"));

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (req, res) => {
    console.log(req.isAuthenticated());
    // Send the user profile as JSON

    res.redirect("https://game-trace.netlify.app/dashboard");
  }
);

app.get("/auth/steam/user", (req, res) => {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
});

app.get("/logout", (req, res) => {
  // Use Passport's logout method to clear the session
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.status(200).json({ message: "Successfully logged out" }); // Send a success response
  });
});

// Route to check if user is authenticated
app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

app.get("/api/owned-games", async (req, res) => {
  const { steamid } = req.query; // Get Steam ID from the query parameter

  if (!steamid) {
    return res.status(400).json({ error: "Steam ID is required" });
  }

  try {
    // Make a request to the Steam API
    const response = await axios.get(
      "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/",
      {
        params: {
          key: STEAM_API_KEY,
          steamid: steamid,
          format: "json",
          include_appinfo: true,
          include_played_free_games: true,
        },
      }
    );

    // Send back the owned games data
    res.json(response.data.response);
  } catch (error) {
    console.error("Error fetching owned games:", error.message);
    res.status(500).json({ error: "Failed to fetch owned games" });
  }
});

app.get("/api/app-achievement", async (req, res) => {
  const { steamid } = req.query; // Get Steam ID from the query parameter
  const { appid } = req.query; // Get Steam ID from the query parameter

  if (!steamid) {
    return res.status(400).json({ error: "Steam ID is required" });
  }

  if (!appid) {
    return res.status(400).json({ error: "App ID is required" });
  }

  try {
    // Make a request to the Steam API
    const response = await axios.get(
      "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/",
      {
        params: {
          key: STEAM_API_KEY,
          steamid: steamid,
          appid: appid,
        },
      }
    );

    // Send back the app achievement data

    res.json(response.data.playerstats.achievements);
  } catch (error) {
    // console.error("Error fetching app achievement:", error.message);
    res.json([]);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
