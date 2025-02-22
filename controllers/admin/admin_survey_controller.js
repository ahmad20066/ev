const Survey = require("../../models/survey/survey");
const Question = require("../../models/survey/question");
const Choice = require("../../models/survey/choice");
const Package = require("../../models/package");
// exports.updateSurvey = async (req, res, next) => {
//     try {
//         const survey = await Survey.findByPk(req.params.id);
//         if (!survey) {
//             return res.status(404).json({ message: "Survey not found" });
//         }

//         const updatedSurvey = await survey.update(req.body);
//         res.status(200).json({ message: "Survey updated successfully", updatedSurvey });
//     } catch (error) {
//         next(error);
//     }
// };

exports.deleteSurvey = async (req, res, next) => {
    try {
        const survey = await Survey.findByPk(req.params.id);
        if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
        }

        await survey.destroy();
        res.status(200).json({ message: "Survey deleted successfully" });
    } catch (error) {
        next(error);
    }
};
exports.createSurvey = async (req, res, next) => {
    try {
        const { title, title_ar, package_id } = req.body;

        if (!title || !package_id) {
            return res.status(400).json({ message: "Title and package_id are required" });
        }

        const package = await Package.findByPk(package_id);
        if (!package) {
            return res.status(404).json({ message: "Package not found" });
        }

        const existingSurvey = await Survey.findOne({ where: { package_id } });
        if (existingSurvey) {
            return res.status(403).json({
                message: "This package already has a survey. Please delete the previous one to add a new survey.",
            });
        }

        const survey = await Survey.create({ title, title_ar, package_id });
        res.status(201).json({ message: "Survey created", survey });
    } catch (error) {
        next(error);
    }
};
exports.updateSurvey = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, title_ar } = req.body; // Both English and Arabic titles

        if (!title || !title_ar) {
            return res.status(400).json({ message: "Both title and title_ar are required" });
        }

        const survey = await Survey.findByPk(id);
        if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
        }

        survey.title = title;
        survey.title_ar = title_ar;
        await survey.save();

        res.status(200).json({ message: "Survey updated successfully", survey });
    } catch (error) {
        next(error);
    }
};



exports.getSurveys = async (req, res, next) => {
    try {
        const surveys = await Survey.findAll({
            include: { model: Question, as: "questions" },
        });
        res.status(200).json({ message: "Surveys retrieved successfully", surveys });
    } catch (error) {
        next(error);
    }
};
exports.getSurvey = async (req, res, next) => {
    try {
        const { id } = req.params
        const survey = await Survey.findByPk(id, {

            include: {
                model: Question,
                as: "questions",
                include: {
                    model: Choice,
                    as: "choices",
                },
            },
        });
        if (!survey) {
            return res.status(404).json({
                message: "Survey not found"
            });;
        }
        res.status(200).json([survey]);
    } catch (error) {
        next(error);
    }
};
exports.getPackageSurvey = async (req, res, next) => {
    try {
        const { package_id } = req.query
        const survey = await Survey.findOne({
            where: {
                package_id
            },
            include: {
                model: Question,
                as: "questions",
                include: {
                    model: Choice,
                    as: "choices",
                },
            },
        });
        if (!survey) {
            return res.status(200).json([]);;
        }
        res.status(200).json([survey]);
    } catch (error) {
        next(error);
    }
};

exports.createQuestion = async (req, res, next) => {
    try {
        const { title, title_ar, type, survey_id, choices, choices_ar } = req.body;
        const image = req.file ? req.file.path : null;

        if (!title || !title_ar || !type || !survey_id) {
            return res.status(400).json({ message: "Title (both languages), type, and survey_id are required" });
        }

        const survey = await Survey.findByPk(survey_id);
        if (!survey) {
            return res.status(404).json({ message: "Survey not found" });
        }

        const question = await Question.create({ title, title_ar, type, image, survey_id });

        if (type === "choice" && Array.isArray(choices) && Array.isArray(choices_ar) && choices.length === choices_ar.length) {
            const choiceData = choices.map((choiceText, index) => ({
                text: choiceText,
                text_ar: choices_ar[index],
                question_id: question.id,
            }));
            await Choice.bulkCreate(choiceData);
        }

        res.status(201).json({ message: "Question created successfully", question });
    } catch (error) {
        next(error);
    }
};


exports.getQuestions = async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const questions = await Question.findAll({
            where: { survey_id: surveyId },
            include: { model: Choice, as: "choices" },
        });

        if (!questions.length) {
            return res.status(404).json({ message: "No questions found for this survey" });
        }

        res.status(200).json({ message: "Questions retrieved successfully", questions });
    } catch (error) {
        next(error);
    }
};

exports.updateQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, title_ar, type, choices, choices_ar } = req.body;
        const image = req.file ? req.file.path : null;

        const question = await Question.findByPk(id);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        if (title) question.title = title;
        if (title_ar) question.title_ar = title_ar;
        if (type) question.type = type;
        if (image) question.image = image;

        await question.save();

        if (type === "choice" && Array.isArray(choices) && Array.isArray(choices_ar) && choices.length === choices_ar.length) {
            await Choice.destroy({ where: { question_id: question.id } });

            const choiceData = choices.map((choiceText, index) => ({
                text: choiceText,
                text_ar: choices_ar[index],
                question_id: question.id,
            }));
            await Choice.bulkCreate(choiceData);
        }

        const updatedQuestion = await Question.findByPk(question.id, {
            include: [{ model: Choice, as: "choices" }],
        });

        res.status(200).json({ message: "Question updated successfully", question: updatedQuestion });
    } catch (error) {
        next(error);
    }
};



exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findByPk(req.params.id);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        await question.destroy();
        res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
        next(error);
    }
};
