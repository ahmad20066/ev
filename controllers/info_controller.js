const FAQ = require("../models/faq");
const PrivacyPolicy = require("../models/privacy_policy");
const TermsAndConditions = require("../models/terms_conditions");

exports.getPrivacyPolicy = async (req, res, next) => {
    try {
        const policy = await PrivacyPolicy.findOne();
        res.status(200).json(policy);
    } catch (error) {
        next(error);
    }
};

exports.createPolicy = async (req, res, next) => {
    try {
        const { content, content_ar } = req.body;
        const policy = await PrivacyPolicy.create({ content, content_ar });
        res.status(201).json({ policy });
    } catch (error) {
        next(error);
    }
};

exports.updatePolicy = async (req, res, next) => {
    try {
        const { content, content_ar } = req.body;
        let policy = await PrivacyPolicy.findOne();

        if (!policy) {
            policy = await PrivacyPolicy.create({ content, content_ar });
        } else {
            if (content !== undefined) policy.content = content;
            if (content_ar !== undefined) policy.content_ar = content_ar;
            await policy.save();
        }

        res.status(200).json({ message: "Privacy Policy Updated Successfully", policy });
    } catch (error) {
        next(error);
    }
};

exports.getTermsAndConditions = async (req, res, next) => {
    try {
        const terms = await TermsAndConditions.findOne();
        res.status(200).json(terms);
    } catch (error) {
        next(error);
    }
};

exports.createTerms = async (req, res, next) => {
    try {
        const { content, content_ar } = req.body;
        const terms = await TermsAndConditions.create({ content, content_ar });
        res.status(201).json({ terms });
    } catch (error) {
        next(error);
    }
};

exports.updateTerms = async (req, res, next) => {
    try {
        const { content, content_ar } = req.body;
        let terms = await TermsAndConditions.findOne();

        if (!terms) {
            terms = await TermsAndConditions.create({ content, content_ar });
        } else {
            if (content !== undefined) terms.content = content;
            if (content_ar !== undefined) terms.content_ar = content_ar;
            await terms.save();
        }

        res.status(200).json({ message: "Terms and Conditions Updated Successfully", terms });
    } catch (error) {
        next(error);
    }
};

exports.getFAQs = async (req, res, next) => {
    try {
        const faqs = await FAQ.findAll();
        res.status(200).json(
            faqs
        );
    } catch (error) {
        next(error);
    }
};

exports.createFAQ = async (req, res, next) => {
    try {
        const { question, question_ar, answer, answer_ar } = req.body;

        if (!question || !question_ar || !answer || !answer_ar) {
            return res.status(400).json({ message: "Both English and Arabic versions are required" });
        }

        const faq = await FAQ.create({ question, question_ar, answer, answer_ar });
        res.status(201).json({ message: "FAQ Created Successfully", faq });
    } catch (error) {
        next(error);
    }
};

exports.updateFAQ = async (req, res, next) => {
    try {
        const { question, question_ar, answer, answer_ar } = req.body;
        const faq = await FAQ.findByPk(req.params.id);

        if (!faq) {
            return res.status(404).json({ message: "FAQ not found" });
        }

        if (question !== undefined) faq.question = question;
        if (question_ar !== undefined) faq.question_ar = question_ar;
        if (answer !== undefined) faq.answer = answer;
        if (answer_ar !== undefined) faq.answer_ar = answer_ar;

        await faq.save();
        res.status(200).json({ message: "FAQ Updated Successfully", faq });
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
