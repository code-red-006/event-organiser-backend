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
        console.log('yes');
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
        body("date")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("event date must be specified"),
        body("type")
            .isLength({min: 1})
            .escape().withMessage("event type must be specified")
            .isAlpha('en-US', { ignore: ' '}).withMessage("event type must be in alphabetics"),
        body("days")
            .not().isEmpty()
            .escape().withMessage("event days must be specified")
            .isNumeric().withMessage("event days must be in numeric"),
        
        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});
            try{
                if(req.body.type === 'Arts'){
                    if(req.body.houses && req.body.houses.length > 0){
                        const { event_name, date, type, houses } = req.body
                        const groupe_points = [10,5,3]
                        const single_points = [5,3,1]
                        await Event.create({ event_name, date, type, houses, groupe_points, single_points });
                        return res.status(200).json({ok: "ok"})
    
                    }else{
                        return res.status(400).json({error:{msg: "house must be specified"}})
                    }
                }else{
                    const { event_name, date, type } = req.body;
                    await Event.create({ event_name, date, type });
                    return res.status(200).json({ok: "ok"})
                }
            }catch(error){
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
                    SingleProgram.find({event_id: eventId}).exec(callback)
                },
                groupePrograms(callback){
                    GroupeProgram.find({event_id: eventId}).exec(callback)
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

    admin_add_single_program_post:[
        body("program_name")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("program name must be specified"),
        body("description")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("description must be specified"),    
        async(req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});
            try {
                await SingleProgram.create({
                    event_id: req.body.eventId,
                    program_name: req.body.program_name,
                    description:req.body.description,
                    start_time: req.body.start_time,
                    report_time: req.body.report_time,
                })
                res.status(200).json({ok: "ok"})
            } catch (error) {
                console.log(error);
                res.status(500).json({error})
            }
        }
    ],

    admin_remove_single_get: async(req, res) => {
        const { id } = req.params;
        try {
            await SingleProgram.findByIdAndDelete(id);
            res.status(200).json({ok:"ok"})
        } catch (error) {
            res.status(500).json({error});
        }
    },

    admin_add_groupe_program_post:[
        body("program_name")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("program name must be specified"),
        body("description")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("description must be specified"),    
        async(req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});
            try {
                await GroupeProgram.create({
                    event_id: req.body.eventId,
                    program_name: req.body.program_name,
                    description:req.body.description,
                    start_time: req.body.start_time,
                    report_time: req.body.report_time,
                })
                res.status(200).json({ok: "ok"})
            } catch (error) {
                console.log(error);
                res.status(500).json({error})
            }
        }
    ],

    admin_remove_groupe_get: async(req, res) => {
        const { id } = req.params;
        try {
            await GroupeProgram.findByIdAndDelete(id);
            res.status(200).json({ok:"ok"})
        } catch (error) {
            res.status(500).json({error});
        }
    },

    admin_fetch_groupe_program: async(req, res) => {
        const {id} = req.params;
        try{
            const groupeProgram = await GroupeProgram.findById(id)
            res.status(200).json({groupeProgram})
        }catch(error){
            res.status(500).json({error})
        }
    },

    admin_fetch_single_program: async(req, res) => {
        const {id} = req.params;
        try{
            const singleProgram = await SingleProgram.findById(id)
            res.status(200).json({singleProgram})
        }catch(error){
            res.status(500).json({error})
        }
    },

    admin_update_groupe_program:[
        body("program_name")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("program name must be specified"),
        body("description")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("description must be specified"),    
        async(req, res) => {
            const {id} = req.params;
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});
            const {program_name,description,start_time,report_time} = req.body
            try {
                await GroupeProgram.findByIdAndUpdate(id,{
                    program_name,
                    description,
                    start_time,
                    report_time
                })
                res.status(200).json({ok: "ok"})
            } catch (error) {
                console.log(error);
                res.status(500).json({error})
            }
        }
    ],

    admin_update_single_program:[
        body("program_name")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("program name must be specified"),
        body("description")
            .trim()
            .isLength({min: 1})
            .escape().withMessage("description must be specified"),    
        async(req, res) => {
            const {id} = req.params;
            const errors = validationResult(req);
            if(!errors.isEmpty()) return res.status(400).json({error:errors.errors[0]});
            const {program_name,description,start_time,report_time} = req.body
            console.log(program_name);
            try {
                await SingleProgram.findByIdAndUpdate(id,{
                    program_name,
                    description,
                    start_time,
                    report_time
                })
                res.status(200).json({ok: "ok"})
            } catch (error) {
                console.log(error);
                res.status(500).json({error})
            }
        }
    ],
}
