const express = require("express");
const axios = require("axios");
const passport = require("passport");
require("dotenv").config();

const Backend_URl = process.env.BACKEND_URL;
const App_URl = process.env.APP_URL;
const EPIC_CLIENT_ID = process.env.EPIC_CLIENT_ID;
const EPIC_CLIENT_SECRET = process.env.EPIC_CLIENT_SECRET;

const router = express.Router();




module.exports = router;
