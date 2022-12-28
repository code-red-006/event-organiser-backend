const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');


module.exports = (req, res, next)=>{
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !=='undefined'){
      const bearer = bearerHeader.split(' ');
      const bearerToken = bearer[1];
      req.token = bearerToken;
      jwt.verify(req.token, process.env.SECRET, (err, authData)=>{

        if(err) return res.status(403).json({msg: err.message})
        
        const isAdmin = Admin.findById(authData.id);
        if(!isAdmin.username) return res.status(403).json({msg: "you are not admin! LOL"});

        req.username = authData.username;
        req.userId = authData.id;
        next()
      })
    }else{
      res.status(403).json({msg:"not authorized no token"})
    }
  }