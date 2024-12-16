const jwt = require('jsonwebtoken')
module.exports = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization
        console.log(authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "unAuthenticated"
            })
        }
        const token = authHeader.split(" ")[1]
        const decodedToken = jwt.verify(token, "ahmad_secret")
        const userId = decodedToken.userId
        req.userId = userId
        req.role = decodedToken.role
        // if (req.method === "OPTIONS") {
        //     return next()
        // }
        console.log(req.role)
        next()
    } catch (e) {
        console.log(e)
        return res.status(401).json({
            message: "unAuthenticated"
        })
    }
}