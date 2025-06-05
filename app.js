const express = require("express");
const app = express();
require('dotenv').config();
const sequelize = require("./models/index");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

// Import security middleware
const { xssProtection, sqlInjectionProtection, sequelizeSanitize, helmet, hpp } = require('./middlewares/security');

// Import rate limiting middleware
const rateLimit = require('express-rate-limit');

// Import format_timestamps middleware
const formatTimestamps = require('./middlewares/format_timestamps');

// Security Headers
// app.use(helmet());

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 login attempts per window
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true,
});

// Apply rate limiting
// app.use(generalLimiter);

// CORS configuration
const corsOptions = {
    origin: true,  // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
// app.use(hpp); // Prevent HTTP Parameter Pollution
// app.use(sequelizeSanitize); // Sequelize input sanitization
// app.use(xssProtection); // XSS protection
// app.use(sqlInjectionProtection); // SQL injection protection

// Static files
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, cors(), express.static(path.join(__dirname, 'uploads')));

// Socket.io setup
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:3000", 'http://dashboard.evolvevw.com', 'https://dashboard.evolvevw.com'],
        credentials: true,
    },
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// Import middleware
const isAuth = require("./middlewares/isAuth");
const isAdmin = require("./middlewares/isAdmin");
const isCoach = require("./middlewares/isCoach");

// Apply stricter rate limiting to auth routes
// app.use("/auth", authLimiter);

// Import routes
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
app.use("/info", infoRouter);



// Apply timestamp formatting middleware globally (after routes, before error handling)
app.use(formatTimestamps);

// Global error handling
app.use((error, req, res, next) => {
    console.error('Error:', error);

    // Handle rate limit errors
    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            error: 'Request entity too large',
            maxSize: '10MB'
        });
    }

    const message = error.message || 'Internal server error';
    const status = error.statusCode || 500;

    res.status(status).json({
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

const cancelExpiredSubscriptions = require("./schedulers/subscriptions_scheduler");
cancelExpiredSubscriptions();

sequelize
    .sync({
        // force: true,
        // alter: true
    })
    .then(() => {
        const PORT = process.env.PORT || 8080;
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);

        });

        io.on("connection", (socket) => {
            console.log("A user connected");

            socket.on("joinChat", (chat_id) => {
                socket.join(`chat_${chat_id}`);
            });
            socket.on("joinCoach", (coachId) => {
                socket.join(`coach_${coachId}`);
            });
            socket.on("joinCoachesRoom", () => {
                socket.join("coaches");
            });
            socket.on("disconnect", () => {
                console.log("User disconnected");
            });
        });
    })
    .catch((e) => {
        console.error(e);
    });