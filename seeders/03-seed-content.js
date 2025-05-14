'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // FAQ seeder
        await queryInterface.bulkInsert('faqs', [
            {
                question: 'How do I cancel my subscription?',
                question_ar: 'كيف يمكنني إلغاء اشتراكي؟',
                answer: 'You can cancel your subscription at any time from your account settings.',
                answer_ar: 'يمكنك إلغاء اشتراكك في أي وقت من إعدادات حسابك.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                question: 'What happens if I miss a workout?',
                question_ar: 'ماذا يحدث إذا فوّت تمريناً؟',
                answer: 'You can reschedule missed workouts or access them later in your dashboard.',
                answer_ar: 'يمكنك إعادة جدولة التمارين المفقودة أو الوصول إليها لاحقاً في لوحة التحكم.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                question: 'How do meal plans work?',
                question_ar: 'كيف تعمل خطط الوجبات؟',
                answer: 'Meal plans are customized based on your fitness goals and dietary preferences.',
                answer_ar: 'خطط الوجبات مخصصة بناءً على أهدافك الرياضية وتفضيلاتك الغذائية.',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Terms and Conditions
        await queryInterface.bulkInsert('terms_and_conditions', [
            {
                content: 'By using Evolve, you agree to our terms and conditions. These terms govern your use of our fitness and nutrition services.',
                content_ar: 'باستخدام إيفولف، فإنك توافق على الشروط والأحكام الخاصة بنا. تحكم هذه الشروط استخدامك لخدمات اللياقة البدنية والتغذية لدينا.',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Privacy Policy
        await queryInterface.bulkInsert('PrivacyPolicies', [
            {
                content: 'At Evolve, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.',
                content_ar: 'في إيفولف، نحن نأخذ خصوصيتك على محمل الجد. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('faqs', null, {});
        await queryInterface.bulkDelete('terms_and_conditions', null, {});
        await queryInterface.bulkDelete('PrivacyPolicies', null, {});
    }
};
