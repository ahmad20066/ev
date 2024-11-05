const User = require("../../models/user");
const WeightRecord = require("../../models/weight_record");

exports.editProfile = async (req, res, next) => {
    const user_id = req.userId;
    const { email, name, phone, image } = req.body
    const user = await User.findByPk(user_id, {

    })
    user.update({})
}