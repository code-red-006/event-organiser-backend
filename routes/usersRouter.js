var express = require('express');
const { user_register_post } = require('../controllers/usersContorller');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//user register route
router.post('/register', user_register_post)

module.exports = router;
