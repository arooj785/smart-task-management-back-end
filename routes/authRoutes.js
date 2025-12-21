const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

//Signup route for admin
router.post('/signup', signup);
//Login route for admin and worker
router.post('/login', login);
module.exports = router;