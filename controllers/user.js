require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
const register=async (req, res) => {
    const {username, email, password } = req.body;
    try {
        let user = await User.find({ $or: [{ email }, { username }] });
        if (user.length) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        const useerCreate=await User.create({
            username,
            email,
            password
        });
        const token = jwt.sign({ userId: useerCreate._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
   
};

// Login user
const login=async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.find
            ({ $or: [{ email }, { username: email }] });
        if (!user.length) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const payload = { userId: user[0]._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get user profile
const userInfo=async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');       
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('username email createdAt');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }   
};
//get all users
const allUser=async (req, res) => {
    try {
        const users = await User.find().select('username email createdAt');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }   
};
// update user profile
const updateProfile=async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    const { username, email } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.username = username || user.username;
        user.email = email || user.email;
        await user.save();
        res.json({ msg: 'userInfo updated' });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }   
};
//update user avtar
const updateAvatar=async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    const {avtar}=req.files;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.avtar = avtar[0].path || user.avtar;
        await user.save();
        res.json({ msg: 'Avatar updated' });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
module.exports = {
    register,
    login,
    userInfo,
    updateProfile,
    updateAvatar,
    allUser
};