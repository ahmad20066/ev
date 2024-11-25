const express = require("express")
const app = express()
const sequelize = require("./models/index")
const authRouter = require("./routes/auth_route")
const adminRouter = require("./routes/admin_route")
const coachRouter = require("./routes/coach_route")
const statsRouter = require("./routes/stats_route")
const dietRouter = require("./routes/diet_route")
const fitnessRouter = require("./routes/fitness_route")
const chatRouter = require("./routes/chat_route")
const isAuth = require("./middlewares/isAuth")
const isAdmin = require("./middlewares/isAdmin")
const isCoach = require("./middlewares/isCoach")
const socketIo = require("socket.io")
const http = require('http');

app.use(express.json())
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
const server = http.createServer(app);
const io = socketIo(server);
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use('/auth', authRouter)
app.use('/admin', adminRouter)
app.use('/coach', isAuth, isCoach, coachRouter)
app.use('/diet', dietRouter)
app.use('/fitness', isAuth, fitnessRouter)
app.use('/stats', isAuth, statsRouter)
app.use('/chat', isAuth, chatRouter)

app.use((error, req, res, next) => {
    console.log(error);
    const message = error.message;
    const status = error.statusCode || 500;
    res.status(status).json({
        Message: message,
    });
});

sequelize.sync({
    // force: true
}).then((result) => {
    app.listen(8080)
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('joinChat', (chat_id) => {
            socket.join(`chat_${chat_id}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
    console.log("Listening to port ")

}).catch((e) => {
    console.log(e)
})
