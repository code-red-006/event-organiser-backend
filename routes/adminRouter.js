var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController');
const jwt = require('jsonwebtoken')
const verifyToken = require('../middleware/verifyToken')

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.send("admin")
});

router.post('/login', adminController.admin_login_post);

router.get('/posts', verifyToken, adminController.admin_posts)

module.exports = router;
