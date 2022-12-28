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
            .trim()
            .isLength({ min: 8 })
            .escape().withMessage("password require minimum of 8 characters"),

        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({error:errors.errors})
            }

            const { name, adm_no, mobile, year, department, password } = req.body;
            
            try {

                await User.create({ name, adm_no, mobile, department, year, password})
                res.status(200).json({ok: "ok"})
            } catch (error) {
                res.status(500).json({error})
            }
        }

    ]
}