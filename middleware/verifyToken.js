const jwt = require('jsonwebtoken')


module.exports = (req, res, next)=>{
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !=='undefined'){
      const bearer = bearerHeader.split(' ');
      const bearerToken = bearer[1];
      req.token = bearerToken;
      jwt.verify(req.token, process.env.SECRET, (err, authData)=>{
        if(err){
          console.log(err);
          res.status(403).json({msg: err.message})
        }else{
            req.username = authData.username;
            next()
        }
      })
    }else{
      res.status(403).json({msg:"not authorized no token"})
    }
  }