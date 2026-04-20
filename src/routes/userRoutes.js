// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController'); // import the class
const userController = new UserController();                     // make an instance

router.post('/register', (req, res) => userController.register(req, res));
router.post('/login',    (req, res) => userController.login(req, res));
router.get ('/profile',  (req, res) => userController.profile(req, res));
router.post('/logout',   (req, res) => userController.logout(req, res));

module.exports = router;
