const jwt = require('jsonwebtoken');
const User = require('../models/user');


module.exports =  (req, res, next)=>{
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !=='undefined'){
      const bearer = bearerHeader.split(' ');
      const bearerToken = bearer[1];
      req.token = bearerToken;
      jwt.verify(req.token, process.env.SECRET, async(err, authData)=>{

        if(err) return res.status(403).json({msg: err.message})
        try {
          const isUser = await User.findById(authData.id);
          if(!isUser) return res.status(403).json({msg: "you are not a user"});

          req.username = authData.username;
          req.userId = authData.id;
          next()
        } catch (error) {
          res.status(500).json({error})
        }
        
      })
    }else{
      res.status(403).json({msg:"not authorized no token"})
    }
  }