var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController');
const jwt = require('jsonwebtoken')
const verifyAdminToken = require('../middleware/verifyAdminToken');

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.send("admin")
});

// login route
router.post('/login', adminController.admin_login_post);

router.get('/verify', verifyAdminToken, (req, res)=>{
  res.status(200).json({username: req.username, id: req.userId})
})

//reset password
router.post('/reset', verifyAdminToken, adminController.admin_reset_password_post);

// EVENTS ROUTES //

// fetch programs for specific events
router.get('/events/:eventId/programs', verifyAdminToken, adminController.admin_fetch_programs_get)

//remove events
router.get('/events/delete/:id', verifyAdminToken, adminController.admin_remove_event_get);

//edit event
router.post('/events/edit/:id', verifyAdminToken, adminController.admin_edit_event_post);

//fetch events
router.get('/events', verifyAdminToken, adminController.admin_fetch_events_get);

// Add events
router.post('/events', verifyAdminToken, adminController.admin_add_event_post);



module.exports = router;
