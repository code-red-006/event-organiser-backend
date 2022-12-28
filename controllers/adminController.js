const Admin = require('../models/admin');
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
    ]

}
