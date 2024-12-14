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
const STEAM_API_KEY = "DE0BB291C879152EDC30355548F39188";
const Backend_URl = "https://game-trace-be.onrender.com";
const App_URl = "https://game-trace.netlify.app";

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

// Routes for authentication
app.get("/auth/steam", passport.authenticate("steam"));

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (req, res) => {
    console.log("return: " + req.isAuthenticated());
    // Send the user profile as JSON

    res.redirect(App_URl + "/dashboard");
  }
);

app.get("/auth/steam/user", (req, res) => {
  console.log("user: " + req.isAuthenticated());
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
  const { steamId } = req.query; // Get Steam ID from the query parameter

  if (!steamId) {
    return res.status(400).json({ error: "Steam ID is required" });
  }

  try {
    // Make a request to the Steam API
    const response = await axios.get(
      "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/",
      {
        params: {
          key: STEAM_API_KEY,
          steamid: steamId,
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
