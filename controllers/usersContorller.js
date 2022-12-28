const User = require('../models/user')
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');


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
                return res.status(400).json({error:errors.errors})
            }
            const { name, adm_no, mobile, year, department, password } = req.body;
            
            const isAdmNo = await User.findOne({adm_no: adm_no});
            if(isAdmNo) return res.status(401).json({error:[{msg: "Admission number already taken"}]})
            const isMobile = await User.findOne({mobile: mobile});
            if(isMobile) return res.status(401).json({error:[{msg: "mobile number already taken"}]});

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
                return res.status(400).json({error:errors.errors})
            }
            
            try {

                const user = await User.findOne({adm_no: req.body.adm_no});
                if(!user) return res.status(401).json({error:[{msg: "Admission number not found! try register"}]});

                const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
                if(!isPasswordMatch) return res.status(401).json({error:[{msg: "incorrect password"}]});

                const payload = {
                    id: user._id,
                    name: user.name,
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
    ]
}