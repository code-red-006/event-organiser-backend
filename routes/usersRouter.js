var express = require('express');
const verifyUserToken = require('../middleware/verifyUserToken');
const usersContorller = require('../controllers/usersContorller');
const adminController = require('../controllers/adminController');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//user register route
router.post('/register', usersContorller.user_register_post);

//user login 
router.post('/login', usersContorller.user_login_post);

//user verify
router.get('/verify', verifyUserToken, (req, res)=>{
  console.log('yes');
  res.status(200).json({username: req.username, id: req.userId})
})

//fetch events
router.get('/events', verifyUserToken, adminController.admin_fetch_events_get );

//fetch single programs
router.get('/programs/single/:eventId/:userId', verifyUserToken, usersContorller.user_fetch_single_get);

//fetch groupe programs
router.get('/programs/groupe/:eventId/:userId', verifyUserToken, usersContorller.user_fetch_groupe_get);

//fetch enrolled programs
router.get('/programs/enrolled/:eventId/:userId', verifyUserToken, usersContorller.user_fetch_enrolled_get)

//enroll single Program
router.get('/single/:proId/:userId', verifyUserToken, usersContorller.user_enroll_single_get);

//enroll groupe programs
router.post('/groupe/:proId/:userId', verifyUserToken, usersContorller.user_enroll_groupe_post)
module.exports = router;
