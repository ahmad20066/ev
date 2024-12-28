const express = require("express");
const app = express();
const sequelize = require("./models/index");
const authRouter = require("./routes/auth_route");
const adminRouter = require("./routes/admin_route");
const coachRouter = require("./routes/coach_route");
const statsRouter = require("./routes/stats_route");
const dietRouter = require("./routes/diet_route");
const fitnessRouter = require("./routes/fitness_route");
const chatRouter = require("./routes/chat_route");
const profileRouter = require("./routes/profile_router");
const homeRouter = require("./routes/home_route");
const kitchenRouter = require("./routes/kitchen_route");
const infoRouter = require("./routes/info_route");
const isAuth = require("./middlewares/isAuth");
const isAdmin = require("./middlewares/isAdmin");
const isCoach = require("./middlewares/isCoach");
const socketIo = require("socket.io");
const path = require("path");
const http = require("http");
const cancelExpiredSubscriptions = require("./schedulers/subscriptions_scheduler");
cancelExpiredSubscriptions();
const cors = require("cors");

// CORS configuration
const corsOptions = {
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true, // Allow cookies or authentication headers
};

// Use CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Remove manual CORS headers (already handled by cors middleware)
// Remove this block to avoid conflicts:
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "OPTIONS, GET, POST, PUT, PATCH, DELETE"
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Replace with your client's URL
        credentials: true,
    },
});

// Make io available in all routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Define routes
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/coach", isAuth, isCoach, coachRouter);
app.use("/diet", dietRouter);
app.use("/fitness", isAuth, fitnessRouter);
app.use("/stats", statsRouter);
app.use("/chat", isAuth, chatRouter);
app.use("/profile", isAuth, profileRouter);
app.use("/home", isAuth, homeRouter);
app.use("/kitchen", kitchenRouter);
app.use("/info", infoRouter)
// Global error handling
app.use((error, req, res, next) => {
    console.error(error);
    const message = error.message;
    const status = error.statusCode || 500;
    res.status(status).json({
        message: message,
    });
});

sequelize
    .sync({
        // force: true
        alter: true
    })
    .then(() => {
        server.listen(8080, () => {
            console.log("Server listening on port 8080");
        });

        io.on("connection", (socket) => {
            console.log("A user connected");

            socket.on("joinChat", (chat_id) => {
                socket.join('chat_${chat_id}');
            });

            socket.on("disconnect", () => {
                console.log("User disconnected");
            });
        });
    })
    .catch((e) => {
        console.error(e);
    });