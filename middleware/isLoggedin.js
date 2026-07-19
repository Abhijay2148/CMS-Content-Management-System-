const jwt = require('jsonwebtoken');

const isLoggedin = async (req, res, next) => {
        try{
                const token = req.cookies.token;
                if (!token) {
                        return res.redirect('/admin/');
                }
                const tokenData = jwt.verify(token, process.env.JWT_SECRET);
                // req.user = decoded;
                req.id = tokenData.id;
                req.role = tokenData.role;
                req.fullname = tokenData.fullname;
                next(); 
        }catch(err){
                res.status(401).json({ message: "Unauthorized" })
        }
}

module.exports = isLoggedin;