const admin = require("firebase-admin");
const serviceAccount = require("../evolve-70f2c-firebase-adminsdk-qz6c5-53f5ec54eb.json"); // Replace with the path to your private key file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
module.exports = admin