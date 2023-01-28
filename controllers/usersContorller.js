const User = require('../models/user')
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const singleProgram = require('../models/singleProgram');
const groupeProgram = require('../models/groupeProgram');
const async = require("async");


module.exports = {
    user_register_post:[
        body("name")
            .trim()
            .isLength({ min: 1 })
            .escape().withMessage("name must be specified.")
            .isAlpha('en-US',{ignore: ' '}).withMessage("name must be in alphabetics"),
        body("adm_no")
            .trim()
            .isLength({ min: 1 })
            .escape().withMessage("Admission number must be specified.")
            .isNumeric().withMessage("Admission number must be numeric"),
        body("mobile")
            .trim()
            .isLength({ min: 1 })
            .escape().withMessage("Mobile number must be specified.")
            .isNumeric().withMessage("Mobile number must be numeric"),
        body("year")
            .trim()
            .isLength({ min: 1 })
            .escape().withMessage("Year must be specified.")
            .isLength({ max: 1 }).withMessage("year length must be 1"),
        body("department")
            .trim()
            .isLength({ min: 1 })
            .escape().withMessage("Department must be specified.")
            .isAlpha('en-US',{ignore: ' '}).withMessage("department must be in alphabetics"),
        body("password")
            .isLength({ min: 8 })
            .escape().withMessage("password require minimum of 8 characters"),

        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({error:errors.errors[0]})
            }
            const { name, adm_no, mobile, year, department, password } = req.body;
            
            const isAdmNo = await User.findOne({adm_no: adm_no});
            if(isAdmNo) return res.status(401).json({error:{msg: "Admission number already taken"}})
            const isMobile = await User.findOne({mobile: mobile});
            if(isMobile) return res.status(401).json({error:{msg: "mobile number already taken"}});

            try {

                await User.create({ name, adm_no, mobile, department, year, password})
                res.status(200).json({ok: "ok"})
            } catch (error) {
                res.status(500).json({error})
            }
        }

    ],

    user_login_post:[
        body("adm_no")
            .trim()
            .isLength({ min: 1 })
            .escape().withMessage("Admission number must be specified.")
            .isNumeric().withMessage("Admission number must be numeric"),
        body("password")
            .trim()
            .isLength({ min: 8 })
            .escape().withMessage("password require minimum of 8 characters"),

        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({error:errors.errors[0]})
            }
            
            try {

                const user = await User.findOne({adm_no: req.body.adm_no});
                if(!user) return res.status(401).json({error:{msg: "Admission number not found! try register"}});

                const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
                if(!isPasswordMatch) return res.status(401).json({error:{msg: "incorrect password"}});

                const payload = {
                    id: user._id,
                    username: user.name,
                }
                jwt.sign(payload, process.env.SECRET,{ expiresIn: '1d'}, (err, token)=>{
                    if(err) return res.status(500).json({err})
                    res.status(200).json({token});
                    console.log(user.name);
                });

            } catch (error) {
                res.status(500).json({error})
            }
        }
    ],
    user_enroll_single_get: async(req, res)  => {
        const {proId, userId} = req.params
        try {
            await singleProgram.updateOne({ _id: proId }, {$push: { participants: userId}})
            res.status(200).json({ok:"ok"})
        } catch (error) {
            res.status(500).json({error})
        }
    },
    user_fetch_single_get: async(req, res) => {
        const {eventId, userId} = req.params;
        try {
            const single = await singleProgram.find({event_id: eventId, participants :{$nin: userId}})
            res.status(200).json({single})
        } catch (error) {
            console.log(error);
            res.status(500).json({error})
        }
    },

    user_fetch_groupe_get: async(req, res) => {
        const {eventId, userId} = req.params;
        try {
            const groupe = await groupeProgram.find({event_id: eventId, "groups.head_id":{$nin : userId}})
            res.status(200).json({groupe})
        } catch (error) {
            console.log(error);
            res.status(500).json({error})
        }
    },

    user_fetch_enrolled_get: (req, res) => {
        const {eventId, userId} = req.params;
        async.parallel(
            {
                single(callback){
                    singleProgram.find({event_id: eventId, participants: {$in: userId }}).exec(callback)
                },
                groupe(callback){
                    groupeProgram.find({event_id: eventId, "groups.head_id": userId}).exec(callback)
                }
            },
            (error, result) => {
                if(error) return res.status(500).json({error});
                res.status(200).json({
                    enrolled: [result.single, result.groupe]
                })
            }
        )
    },

    user_enroll_groupe_post: async(req, res)  => {
        const {proId} = req.params;
        const {groupe} = req.body
        try {
            await groupeProgram.updateOne({ _id: proId }, {$push: { groups: groupe}})
            res.status(200).json({ok:"ok"})
        } catch (error) {
            res.status(500).json({error})
        }
    },
}