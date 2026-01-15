
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const { setUser } = require('../service/auth');

async function handleUserSignup(req, res) {
    const { name, email, password } = req.body;
    
    await User.create({
        name,
        email,
        password,
    });
    
    return res.redirect("/");
}

async function handleUserLogin(req, res) {
    const { email, password } = req.body;
    
    console.log("1. User typed:", email, password);
    
    const user = await User.findOne({ email, password });
    
    console.log("2. DB found:", user);
    // ----------------

    if (!user) {
        return res.render("login", {
            error: "Invalid Username or Password",
        });
    }

    // Generate Session ID
    const sessionId = uuidv4();
    setUser(sessionId, user);

    // Send Cookie
    res.cookie("uid", sessionId);
    
    return res.redirect("/");
}

module.exports = {
    handleUserSignup,
    handleUserLogin,
};