const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/coupon_controller');
const adminPackageController = require('../../controllers/admin/admin_package_controller');

router.post('/apply-to-package', adminPackageController.applyCouponToPackage);

module.exports = router; 