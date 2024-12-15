const express = require("express");
const axios = require("axios");
const passport = require("passport");
require("dotenv").config();
const Backend_URl = process.env.BACKEND_URL;
const App_URl = process.env.APP_URL;

const router = express.Router();

const STEAM_API_KEY = process.env.STEAM_API_KEY;

router.get("/auth/steam", passport.authenticate("steam"));

router.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (req, res) => {
    console.log("return: " + req.isAuthenticated());
    // Send the user profile as JSON

    res.redirect(App_URl + "/dashboard");
  }
);

router.get("/auth/steam/user", (req, res) => {
  console.log("user: " + req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
});

router.get("/logout", (req, res) => {
  // Use Passport's logout method to clear the session
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.status(200).json({ message: "Successfully logged out" }); // Send a success response
  });
});

// Route to check if user is authenticated
router.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

router.get("/api/owned-games", async (req, res) => {
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

router.get("/api/router-achievement", async (req, res) => {
  const { steamid } = req.query; // Get Steam ID from the query parameter
  const { appid } = req.query; // Get Steam ID from the query parameter

  if (!steamid) {
    return res.status(400).json({ error: "Steam ID is required" });
  }

  if (!appid) {
    return res.status(400).json({ error: "router ID is required" });
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

    // Send back the router achievement data

    res.json(response.data.playerstats.achievements);
  } catch (error) {
    // console.error("Error fetching router achievement:", error.message);
    res.json([]);
  }
});

module.exports = router;
