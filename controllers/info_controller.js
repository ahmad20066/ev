const FAQ = require("../models/faq");
const PrivacyPolicy = require("../models/privacy_policy");
const TermsAndConditions = require("../models/terms_conditions");

exports.getPrivacyPolicy = async (req, res, next) => {
    try {
        const policy = await PrivacyPolicy.findOne();
        res.status(200).json(policy);
    } catch (error) {
        next(error)
    }
}
exports.createPolicy = async (req, res, next) => {
    try {
        const { content } = req.body;
        const policy = await PrivacyPolicy.create({ content });
        res.status(201).json({ policy });
    } catch (error) {
        next(error)
    }
}
exports.updatePolicy = async (req, res, next) => {
    try {
        const { content } = req.body
        const policy = await PrivacyPolicy.findOne()
        if (!policy) {
            await PrivacyPolicy.create({ content })
            res.status(200).json({
                message: "Policy Updated Successfully"

            })
        }
        policy.content = content
        await policy.save()
        res.status(200).json({
            message: "Policy Updated Successfully"
        })
    } catch (e) {
        next(e)
    }
}
exports.getTermsAndConditions = async (req, res, next) => {
    try {
        const terms = await TermsAndConditions.findOne();
        res.status(200).json({ terms });
    } catch (error) {
        next(error)
    }
}
exports.createTerms = async (req, res, next) => {
    try {
        const { content } = req.body;
        const terms = await TermsAndConditions.create({ content });
        res.status(201).json({ terms });
    } catch (error) {
        next(error);
    }
};

exports.updateTerms = async (req, res, next) => {
    try {
        const { content } = req.body;
        const terms = await TermsAndConditions.findOne();
        if (!terms) {
            await TermsAndConditions.create({ content })
            res.status(200).json({ message: "Terms and Conditions Updated Successfully" });

        }
        terms.content = content;
        await terms.save();
        res.status(200).json({ message: "Terms and Conditions Updated Successfully" });
    } catch (error) {
        next(error);
    }
};
exports.getFAQs = async (req, res, next) => {
    try {
        const faqs = await FAQ.findAll();
        res.status(200).json({ faqs });
    } catch (error) {
        next(error);
    }
};

exports.createFAQ = async (req, res, next) => {
    try {
        const { question, answer } = req.body;
        const faq = await FAQ.create({ question, answer });
        res.status(201).json({ faq });
    } catch (error) {
        next(error);
    }
};

exports.updateFAQ = async (req, res, next) => {
    try {
        const { question, answer } = req.body;
        const faq = await FAQ.findByPk(req.params.id);
        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }
        faq.question = question;
        faq.answer = answer;
        await faq.save();
        res.status(200).json({ message: "FAQ Updated Successfully" });
    } catch (error) {
        next(error);
    }
};

exports.deleteFAQ = async (req, res, next) => {
    try {
        const faq = await FAQ.findByPk(req.params.id);
        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }
        await faq.destroy();
        res.status(200).json({ message: "FAQ Deleted Successfully" });
    } catch (error) {
        next(error);
    }
};
