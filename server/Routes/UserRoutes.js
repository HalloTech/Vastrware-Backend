const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require("../Models/UserModels");
const jwt = require("jsonwebtoken");
const router = express.Router(); 

router.post('/signup',
  [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    check('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    check('username').notEmpty().withMessage('Username is required')
  ],
  async (req, res, next) => {
    const { email, password, username, confirmPassword, role } = req.body; 
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'Email already exists' }] });
      }

      user = new User({
        email,
        password,
        username,  
        confirmPassword,
        role: email === 'admin@example.com' ? 'admin' : 'customer'
      });

      await user.save();
      const accessToken = generateAccessToken({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });

      res.status(201).json({ accessToken: accessToken });
      next();
    } catch (error) {
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "700m" });
}


let refreshTokens = [];

function generateRefreshToken(user) {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "900m" });
  refreshTokens.push(refreshToken);
  return refreshToken;
}

router.post("/refreshToken", (req, res) => {
  if (!refreshTokens.includes(req.body.token)) res.status(400).send("Refresh Token Invalid");
  refreshTokens = refreshTokens.filter(c => c != req.body.token);
  const accessToken = generateAccessToken({
    user: req.body.user
  });
  const refreshToken = generateRefreshToken({
    user: req.body.user
  });

  res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

router.post('/login',
  [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("validationResult Error");
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const accessToken = generateAccessToken({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });

      res.json({ accessToken: accessToken });
    } catch (error) {
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

module.exports = router;
