const express = require("express")
const router = express.Router()
const controller = require("../controllers/info_controller")
router.get('/privacy-policy', controller.getPrivacyPolicy);
router.post('/privacy-policy', controller.createPolicy);
router.put('/privacy-policy', controller.updatePolicy);

// Terms and Conditions Routes
router.get('/terms-and-conditions', controller.getTermsAndConditions);
router.post('/terms-and-conditions', controller.createTerms);
router.put('/terms-and-conditions', controller.updateTerms);

// FAQ Routes
router.get('/faqs', controller.getFAQs);
router.post('/faqs', controller.createFAQ);
router.put('/faqs/:id', controller.updateFAQ);
router.delete('/faqs/:id', controller.deleteFAQ);
module.exports = router