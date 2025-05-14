'use strict';

const helmet = require('helmet');
const xss = require('xss');
const hpp = require('hpp');

// XSS Protection middleware
const xssProtection = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key]);
            }
        });
    }

    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = xss(req.query[key]);
            }
        });
    }

    // Sanitize URL parameters
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            if (typeof req.params[key] === 'string') {
                req.params[key] = xss(req.params[key]);
            }
        });
    }

    next();
};

// Enhanced SQL Injection Prevention for Sequelize
const sqlInjectionProtection = (req, res, next) => {
    const sqlInjectionPatterns = [
        // SQL Keywords
        /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/gi,
        // SQL Operators and comments
        /(\b(AND|OR|NOT|--|#|\/\*|\*\/|;)\b)/gi,
        // Information schema and system tables
        /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS|SYSUSERS)/gi,
        // SQL Functions
        /(CHAR|ASCII|SUBSTRING|LENGTH|CONCAT|VERSION|DATABASE|USER)/gi,
        // SQL Injection attempts
        /('|(\\')|(;)|(--)|(\*\/)|(\*\*)|(\|\|))/gi,
        // Common SQL injection patterns
        /(1=1|1=1--|admin'--|' OR '1'='1)/gi
    ];

    const checkForSQLInjection = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Skip checking for legitimate SQL-like content in certain fields
                const skipFields = ['description', 'description_ar', 'instructions', 'instructions_ar', 'notes', 'notes_ar'];
                if (skipFields.includes(key)) {
                    continue;
                }

                for (let pattern of sqlInjectionPatterns) {
                    if (pattern.test(obj[key])) {
                        console.warn(`Potential SQL injection detected in field '${key}':`, obj[key]);
                        return true;
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkForSQLInjection(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    };

    if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
        return res.status(400).json({
            error: 'Invalid input detected',
            code: 'INVALID_INPUT'
        });
    }

    next();
};

// Sequelize Input Sanitization (since you're not using MongoDB)
const sequelizeSanitize = (req, res, next) => {
    // Remove null bytes
    const removeNullBytes = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].replace(/\0/g, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                removeNullBytes(obj[key]);
            }
        }
    };

    if (req.body) removeNullBytes(req.body);
    if (req.query) removeNullBytes(req.query);
    if (req.params) removeNullBytes(req.params);

    next();
};

// Content Security Policy
const cspConfig = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        workerSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
    },
};

module.exports = {
    xssProtection,
    sqlInjectionProtection,
    sequelizeSanitize,
    helmet: helmet({
        contentSecurityPolicy: cspConfig,
        crossOriginEmbedderPolicy: false // Allow embedding resources
    }),
    hpp: hpp({
        whitelist: ['sort', 'page', 'limit', 'fields', 'include'] // Allow these query params to have arrays
    })
}; 