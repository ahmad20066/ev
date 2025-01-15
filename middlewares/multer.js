const multer = require('multer');
const path = require('path');
const BASE_URL = process.env.BASE_URL
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|mp4|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
    },
    fileFilter: fileFilter
});

exports.uploadSingleImage = (field) => {
    return (req, res, next) => {
        const singleUpload = upload.single(field);

        singleUpload(req, res, (err) => {
            if (err) {
                return next(err);
            }

            if (req.file) {
                // Prepend the base URL to the file path
                req.file.url = `${BASE_URL}/${req.file.path}`;
            }

            next();
        });
    };
};

exports.uploadMultiImages = (fields) => {
    return (req, res, next) => {
        const multiUpload = upload.fields(fields);

        multiUpload(req, res, (err) => {
            if (err) {
                return next(err);
            }

            if (req.files) {
                Object.keys(req.files).forEach(fieldName => {
                    req.files[fieldName].forEach(file => {
                        file.url = `${BASE_URL}/${file.path}`; // Prepend base URL to each file
                    });
                });
            }

            next();
        });
    };
};
exports.uploadAnyImages = () => {
    return (req, res, next) => {
        const anyUpload = upload.any();

        anyUpload(req, res, (err) => {
            if (err) {
                return next(err);
            }

            if (req.files) {
                req.files.forEach(file => {
                    file.url = `${BASE_URL}/${file.path}`; // Prepend base URL to each file
                });
            }

            next();
        });
    };
};

