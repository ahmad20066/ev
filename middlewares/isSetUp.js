const jwt = require('jsonwebtoken');

exports.checkProfileSetup = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication failed" });
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);

        if (!decodedToken.is_set_up) {
            return res.status(403).json({ message: "Please complete profile setup before accessing this resource." });
        }

        req.userData = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Authentication failed" });
    }
};
