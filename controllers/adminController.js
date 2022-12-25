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
            .isAlphanumeric().withMessage("username cannot contain alpha-numeric charecters"),
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
                    res.status(401).json({msg:"invalid password"});
                }
                var payload = {
                    id: admin._id,
                    username : req.body.username,
                }
                jwt.sign(payload, process.env.SECRET,{ expiresIn: '1d'}, (err, token)=>{
                    res.json({token});

                });
            } catch (error) {
                res.status(500).json({error})
            }
        }
        
    ],

    admin_posts:(req, res)=>{
        res.json({name: req.username})
    }

}
