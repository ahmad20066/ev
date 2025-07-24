const axios = require('axios');

const LOGINEXT_API_BASE = process.env.LOGINEXT_API_BASE || 'https://api.loginextsolutions.com';
const LOGINEXT_API_KEY = process.env.LOGINEXT_API_KEY;

function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD_${timestamp}_${random}`;
}

exports.createDeliveryOrder = async (req, res, next) => {
    try {
        const {
            orderNo,
            shipmentOrderDt,
            deliverStartTimeWindow,
            deliverEndTimeWindow,
            distributionCenter,
            packageValue,
            paymentType,
            partialDeliveryAllowedFl,
            deliverBranch,
            deliverAccountCode,
            deliverAccountName,
            deliverState,
            deliverCountry,
            deliverCity,
            deliverPinCode,
            deliverStreetName,
            deliverApartment,
            returnBranch,
            cancellationALowwed,
            shipmentCrateMappings,
            deliverPhoneNumber
        } = req.body;

        if (!distributionCenter) {
            return res.status(400).json({ error: 'distributionCenter is required' });
        }
        if (!deliverBranch) {
            return res.status(400).json({ error: 'deliverBranch is required' });
        }
        if (!deliverAccountCode) {
            return res.status(400).json({ error: 'deliverAccountCode is required' });
        }
        if (!deliverAccountName) {
            return res.status(400).json({ error: 'deliverAccountName is required' });
        }

        const loginextPayload = {
            orderNo: orderNo || generateOrderNumber(),
            shipmentOrderTypeCd: 'DELIVER',
            orderState: 'FORWARD',
            shipmentOrderDt: shipmentOrderDt || new Date().toISOString(),
            deliverStartTimeWindow,
            deliverEndTimeWindow,
            distributionCenter,
            packageValue,
            paymentType: paymentType || 'COD',
            partialDeliveryAllowedFl: partialDeliveryAllowedFl || 'Y',
            deliverBranch,
            deliverAccountCode,
            deliverAccountName,
            deliverState,
            deliverCountry,
            deliverCity,
            deliverPinCode,
            deliverStreetName,
            deliverApartment,
            returnBranch,
            cancellationALowwed: cancellationALowwed || '',
            shipmentCrateMappings: shipmentCrateMappings || [],
            deliverPhoneNumber
        };

        const response = await axios.post(
            `${LOGINEXT_API_BASE}/ShipmentApp/mile/v2/create`,
            loginextPayload,
            {
                headers: {
                    'Authorization': `Bearer ${LOGINEXT_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(201).json({
            success: true,
            message: 'Delivery order created successfully',
            data: {
                orderNo: loginextPayload.orderNo,
                loginextResponse: response.data
            }
        });

    } catch (error) {
        console.error('LoginExt API Error:', error.response?.data || error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: 'LoginExt API Error',
                details: error.response.data
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Failed to create delivery order',
                details: error.message
            });
        }
    }
};

exports.getOrderStatus = async (req, res, next) => {
    try {
        const { orderNo } = req.params;

        if (!orderNo) {
            return res.status(400).json({ error: 'orderNo is required' });
        }

        const response = await axios.get(
            `${LOGINEXT_API_BASE}/ShipmentApp/mile/v1/orders/${orderNo}`,
            {
                headers: {
                    'Authorization': `Bearer ${LOGINEXT_API_KEY}`
                }
            }
        );

        res.status(200).json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('LoginExt API Error:', error.response?.data || error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: 'LoginExt API Error',
                details: error.response.data
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Failed to get order status',
                details: error.message
            });
        }
    }
};
