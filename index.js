const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser"); 
const shortid = require("shortid"); 

const URL = require("./models/url");
const userRoute = require('./routes/user');
const { restrictToLoggedinUserOnly } = require('./middleware/auth'); 

const app = express();
const PORT = 3001;

// --- MIDDLEWARE ---
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // 

// --- ROUTES ---

// 1. User Routes (Signup/Login logic)
app.use('/user', userRoute);

// 2. View Routes (The pages)
app.get('/signup', (req, res) => {
    return res.render('signup');
});

app.get('/login', (req, res) => {
    return res.render('login');
});

// 3. Protected Home Route (The Gatekeeper)
// The middleware 'restrictToLoggedinUserOnly' runs BEFORE the function
app.get("/", restrictToLoggedinUserOnly, async (req, res) => {
    const allUrls = await URL.find({});
    return res.render("home", {
        urls: allUrls, 
    });
});

// 4. Analytics
app.get('/analytics/:shortId', async (req, res) => {
    const shortId = req.params.shortId;
    const result = await URL.findOne({ shortId });
    return res.json({ 
        totalClicks: result.visitHistory.length, 
        analytics: result.visitHistory 
    });
});

// 5. ShortURL Redirect (Wildcard - MUST BE LAST GET)
app.get("/:shortId", async (req, res) => {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate(
        { shortId }, 
        { 
            $push: { 
                visitHistory: { timestamp: Date.now() } 
            } 
        }
    );
    if (entry) {
        res.redirect(entry.redirectURL);
    } else {
        res.status(404).json({ error: "Link not found" });
    }
});

// In index.js

app.post("/url", restrictToLoggedinUserOnly, async (req, res) => {
    const body = req.body;
    if (!body.url) return res.status(400).json({ error: "url is required" });
    
    const newShortId = shortid.generate();
    
    await URL.create({
        shortId: newShortId,
        redirectURL: body.url,
        visitHistory: [],
        createdBy: req.user._id, 
    });

    return res.render("home", {
        id: newShortId, 
    });
});

// --- CONNECT ---
mongoose.connect("mongodb://127.0.0.1:27017/short-url-app")
    .then(() => console.log(" MongoDB Connected"))
    .catch((err) => console.log(" DB Error", err));

app.listen(PORT, () => console.log(`Server Started on PORT ${PORT}`));