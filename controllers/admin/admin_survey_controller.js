const Survey = require("../../models/survey/survey");
const Question = require("../../models/survey/question");
const Package = require("../../models/package");
exports.createSurvey = async (req, res, next) => {
    try {
        const { title, package_id } = req.body;

        console.log(title)
        const package = await Package.findByPk(package_id)
        if (!package) {
            const error = new Error("Package not found")
            error.statusCode = 404
            throw error;
        }
        const existingSurvey = await Survey.findOne({
            where: {
                package_id
            }
        })
        if (!existingSurvey) {
            const error = new Error("This package already has a survey, Please delete the previous one to add this")
            error.statusCode = 403
            throw error
        }
        const survey = new Survey({ title, package_id });
        await survey.save()
        res.status(201).json({ message: "Survey created", survey });
    } catch (error) {
        next(error)
    }
};

exports.getSurveys = async (req, res, next) => {
    try {
        const surveys = await Survey.findAll();
        res.status(200).json(surveys);
    } catch (error) {
        next(error)
    }
};

exports.getSurvey = async (req, res, next) => {
    try {
        const survey = await Survey.findByPk(req.params.id);
        if (!survey) return res.status(404).json({ message: "Survey not found" });
        res.status(200).json(survey);
    } catch (error) {
        next(error)
    }
};

exports.updateSurvey = async (req, res, next) => {
    try {
        const survey = await Survey.findByPk(req.params.id);
        if (!survey) return res.status(404).json({ message: "Survey not found" });
        const updatedSurvey = await survey.update(req.body);
        res.status(200).json({ message: "Survey updated", updatedSurvey });
    } catch (error) {
        next(error)
    }
};

exports.deleteSurvey = async (req, res, next) => {
    try {
        const survey = await Survey.findByPk(req.params.id);
        if (!survey) return res.status(404).json({ message: "Survey not found" });
        await survey.destroy();
        res.status(200).json({ message: "Survey deleted" });
    } catch (error) {
        next(error)
    }
};


exports.createQuestion = async (req, res, next) => {
    try {
        const { title, survey_id } = req.body;
        const image = req.file
        const survey = await Survey.findByPk(survey_id)
        if (!survey) {
            const error = new Error("Survey not found")
            error.statusCode = 404
            throw error;
        }
        const question = await Question.create({ title, image: image.path, survey_id });
        res.status(201).json({ message: "Question created", question });
    } catch (error) {
        next(error)
    }
};

exports.getQuestions = async (req, res, next) => {
    try {
        const questions = await Question.findAll({ where: { survey_id: req.params.surveyId } });
        res.status(200).json(questions);
    } catch (error) {
        next(error)
    }
};

