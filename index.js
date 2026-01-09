const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid"); 
const URL = require("./models/url");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/short-url-app")
    .then(() => console.log(" MongoDB Connected"))
    .catch((err) => console.log(" DB Error", err));

//route1
app.post("/url", async (req, res) => {
    const body = req.body;
    
    if (!body.url) return res.status(400).json({ error: "url is required" });

    const newShortId = shortid.generate();

    // 2. Save to Database
    await URL.create({
        shortId: newShortId,
        redirectURL: body.url,
        visitHistory: [],
    });

    // 3. Send back the ID
    return res.json({ id: newShortId });
});


// ROUTE 2 (GET) 
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

    // ROUTE 3
app.get('/analytics/:shortId', async (req, res) => {
    const shortId = req.params.shortId;
    
    //finding link in db
    const result = await URL.findOne({ shortId });
    
    if (!result) {
        return res.status(404).json({ error: "Short URL not found" });
    }

    //  Return the stats
    return res.json({ 
        totalClicks: result.visitHistory.length, 
        analytics: result.visitHistory 
    });
});

    if (entry) {
        res.redirect(entry.redirectURL);
    } else {
        res.status(404).json({ error: "Link not found" });
    }
});

app.listen(3001, () => console.log("Server Started on PORT 3001"));