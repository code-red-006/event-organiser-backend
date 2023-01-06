const Admin = require('../models/admin');
const Event = require('../models/events');
const SingleProgram = require('../models/singleProgram');
const GroupeProgram = require('../models/groupeProgram');
const async = require("async");
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

module.exports = {
    admin_login_post: [
        body("username")
            .trim()
            .isLength({ min: 1 })
            .escape().withMessage("username must be specified.")
            .isAlpha('en-US',{ignore: ' '}).withMessage("username must be in alphabetics"),
        body("password")
            .isLength({min: 7}).withMessage("password must contain 7 charecters"),

        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                console.log(errors.errors[0]);
                return res.status(400).json({error:errors.errors[0]})
            }
            try {
                var admin = await Admin.findOne({username: req.body.username})
                if(!admin){
                    return res.status(401).json({error:{msg:"invalid username"}})
                }
                var isPasswordMatch = await bcrypt.compare(req.body.password, admin.password);
                if(!isPasswordMatch){
                    console.log('not');
                    return res.status(401).json({error:{msg:"invalid password"}});
                }
                var payload = {
                    id: admin._id,
                    username : req.body.username,
                }
                jwt.sign(payload, process.env.SECRET,{ expiresIn: '1d'}, (err, token)=>{
                    res.status(200).json({token});
                    console.log(req.body.username);

                });
            } catch (error) {
                res.status(500).json({error})
            }
        }
        
    ],

    admin_reset_password_post:[
        body("new_password")
            .isLength({min: 7}).withMessage("new password must contain 7 characters"),
        body("confirm_password")
            .isLength({min: 7}).withMessage("confirm password must contain 7 characters"),
        
        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});

            const { new_password, confirm_password } = req.body;
            if(new_password != confirm_password) return res.status(401).json({error:[{msg:"new password didn't mathch confirm password"}]});

            try {
                const hash = await bcrypt.hash(new_password, 10);
                await Admin.updateOne({_id: req.userId }, { password: hash })
                res.json({ok: "success"})
            } catch (error) {
                res.status(500).json({error})
            }
        }
    ],

    admin_fetch_events_get: async (req, res) => {
        try {
            const events = await Event.find();
            res.status(200).json({events})
        } catch (error) {
            res.status(500).json({error})
        }
    },

    admin_add_event_post:[
        body("event_name")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("event name must be specified")
            .isAlpha('en-US', { ignore: ' '}).withMessage("event name must be in alphabetics"),
        
        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});

            try {
                await Event.create({ event_name: req.body.event_name });
                res.status(200).json({ok: "ok"})
            } catch (error) {
                console.log(error);
                res.status(500).json({error})
            }
        }
    ],

    admin_remove_event_get: async(req, res) => {
        try {
            await Event.findByIdAndDelete(req.params.id);
            await SingleProgram.deleteMany({event_id: req.params.id});
            await GroupeProgram.deleteMany({event_id: req.params.id});
            res.status(200).json({ok: 'ok'})
        } catch (error) {
            res.status(500).json({error})
        }
    },

    admin_edit_event_post:[
        body("event_name")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("event name must be specified")
            .isAlpha('en-US', { ignore: ' '}).withMessage("event name must be in alphabetics"),
        
        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});
            const id = req.params.id
            try {
                await Event.findByIdAndUpdate(id, { event_name: req.body.event_name });
                res.status(200).json({ok: "ok"})
            } catch (error) {
                console.log(error);
                res.status(500).json({error})
            }
        }
    ],

    admin_fetch_programs_get: (req, res) => {
        const eventId = req.params.eventId;
        async.parallel(
            {
                singlePrograms(callback){
                    SingleProgram.find({event_id: eventId}, "program_name").exec(callback)
                },
                groupePrograms(callback){
                    GroupeProgram.find({event_id: eventId}, "program_name").exec(callback)
                },
                event(callback){
                    Event.findById(eventId).exec(callback)
                }
            },
            (error, result) => {
                if(error) return res.status(500).json({error});

                res.status(200).json({
                    single: result.singlePrograms,
                    groupe: result.groupePrograms,
                    event: result.event
                });
            }
        )
    },

    admin_add_programs_post:[
        body("program_name")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("event name must be specified"),

        async(req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});
            try {
                await SingleProgram.create({event_id: req.body.eventId, program_name: req.body.program_name})
                res.status(200).json({ok: "ok"})
            } catch (error) {
                console.log(error);
                res.status(500).json({error})
            }
        }
    ],

    admin_remove_single_get: async(req, res) => {
        const {eventId, id} = req.params;
        try {
            await SingleProgram.deleteOne({event_id: eventId, _id: id})
            res.status(200).json({ok:"ok"})
        } catch (error) {
            res.status(500).json({error});
        }
    }

}
