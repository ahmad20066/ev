module.exports = (req, res, next) => {
    const role = req.role;
    console.log(role)
    if (role != "admin" && role != "coach") {
        return res.status(403).json({
            message: "UnAuthorized"
        })
    }
    next()

}