var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController');
const jwt = require('jsonwebtoken')
const verifyToken = require('../middleware/verifyToken')

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.send("admin")
});

// login route
router.post('/login', adminController.admin_login_post);

router.get('/verify', verifyToken, (req, res)=>{
  res.status(200).json(req.username)
})

//reset password
router.post('/reset', verifyToken, adminController.admin_reset_password_post)

module.exports = router;
