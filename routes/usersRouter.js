var express = require('express');
const { user_register_post, user_login_post } = require('../controllers/usersContorller');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//user register route
router.post('/register', user_register_post);

//user login 
router.post('/login', user_login_post);

module.exports = router;
