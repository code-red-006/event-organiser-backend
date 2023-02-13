var express = require('express');
const verifyUserToken = require('../middleware/verifyUserToken');
const usersContorller = require('../controllers/usersContorller');
const adminController = require('../controllers/adminController');
const User = require('../models/user')
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
router.get('/verify', verifyUserToken, async(req, res)=>{
  try {
    const user = await User.findById(req.userId);
    return res.status(200).json({username: req.username, id: req.userId, admNo: user.adm_no})
  } catch (error) {
    res.status(500).json({ error });
  }
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
router.post('/single/:proId', verifyUserToken, usersContorller.user_enroll_single_post);

//enroll groupe programs
router.post('/groupe/:proId/:userId', verifyUserToken, usersContorller.user_enroll_groupe_post)

//get user house
router.get('/house/:userId', verifyUserToken, usersContorller.user_fetch_house_get);

//set user house
router.post('/house/:userId', verifyUserToken, usersContorller.user_set_house_post);

//check user limit off-stage
router.get('/check/off-stage/:admNo', verifyUserToken, usersContorller.user_check_limit_0ff_stage_get);

//check user limit on-stage
router.get('/check/on-stage/:admNo', verifyUserToken, usersContorller.user_check_limit_on_stage_get);

module.exports = router;
