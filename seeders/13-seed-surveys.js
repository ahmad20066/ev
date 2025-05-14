'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Clear existing data first
        await queryInterface.bulkDelete('Choices', null, {});
        await queryInterface.bulkDelete('Questions', null, {});
        await queryInterface.bulkDelete('Surveys', null, {});

        const now = new Date();

        // Create survey
        const surveys = [
            {
                title: 'Fitness Goals Assessment',
                title_ar: 'تقييم أهداف اللياقة البدنية',
                createdAt: now,
                updatedAt: now
            }
        ];

        await queryInterface.bulkInsert('Surveys', surveys);

        // Get the inserted survey ID
        const [surveyResult] = await queryInterface.sequelize.query(
            'SELECT id FROM Surveys ORDER BY id DESC LIMIT 1',
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const surveyId = surveyResult.id;

        // Create questions for the survey
        const questions = [
            {
                survey_id: surveyId,
                title: 'What is your primary fitness goal?',
                title_ar: 'ما هو هدفك الأساسي في اللياقة البدنية؟',
                type: 'choice',
                createdAt: now,
                updatedAt: now
            },
            {
                survey_id: surveyId,
                title: 'How many days per week can you commit to working out?',
                title_ar: 'كم يوم في الأسبوع يمكنك الالتزام بالتمرين؟',
                type: 'choice',
                createdAt: now,
                updatedAt: now
            },
            {
                survey_id: surveyId,
                title: 'What type of exercises do you prefer?',
                title_ar: 'ما نوع التمارين التي تفضلها؟',
                type: 'choice',
                createdAt: now,
                updatedAt: now
            }
        ];

        await queryInterface.bulkInsert('Questions', questions);

        // Get inserted question IDs
        const questionResults = await queryInterface.sequelize.query(
            'SELECT id FROM Questions WHERE survey_id = ? ORDER BY id',
            {
                replacements: [surveyId],
                type: queryInterface.sequelize.QueryTypes.SELECT
            }
        );

        // Create choices for the questions
        const choices = [
            // Choices for question 1 (Primary fitness goal)
            {
                question_id: questionResults[0].id,
                text: 'Weight Loss',
                text_ar: 'فقدان الوزن',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[0].id,
                text: 'Muscle Building',
                text_ar: 'بناء العضلات',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[0].id,
                text: 'General Fitness',
                text_ar: 'لياقة عامة',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[0].id,
                text: 'Strength Training',
                text_ar: 'تدريب القوة',
                createdAt: now,
                updatedAt: now
            },

            // Choices for question 2 (Days per week)
            {
                question_id: questionResults[1].id,
                text: '1-2 days',
                text_ar: '1-2 أيام',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[1].id,
                text: '3-4 days',
                text_ar: '3-4 أيام',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[1].id,
                text: '5-6 days',
                text_ar: '5-6 أيام',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[1].id,
                text: 'Daily',
                text_ar: 'يومياً',
                createdAt: now,
                updatedAt: now
            },

            // Choices for question 3 (Exercise types)
            {
                question_id: questionResults[2].id,
                text: 'Cardio',
                text_ar: 'كارديو',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[2].id,
                text: 'Weight Training',
                text_ar: 'تدريب الأثقال',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[2].id,
                text: 'Yoga/Stretching',
                text_ar: 'يوجا/تمدد',
                createdAt: now,
                updatedAt: now
            },
            {
                question_id: questionResults[2].id,
                text: 'HIIT',
                text_ar: 'تدريب عالي الكثافة',
                createdAt: now,
                updatedAt: now
            }
        ];

        await queryInterface.bulkInsert('Choices', choices);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Choices', null, {});
        await queryInterface.bulkDelete('Questions', null, {});
        await queryInterface.bulkDelete('Surveys', null, {});
    }
};
