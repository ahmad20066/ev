'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Create workout templates (is_template = true)
        await queryInterface.bulkInsert('workouts', [
            {
                image: 'beginner-fullbody.jpg',
                title: 'Beginner Full Body',
                title_ar: 'مبتدئ جسم كامل',
                type: 'group',
                difficulty_level: 'Beginner',
                description: 'Complete beginner workout targeting all major muscle groups',
                description_ar: 'تمرين مبتدئ كامل يستهدف جميع المجموعات العضلية الرئيسية',
                duration: 45,
                coach: 2, // Head Coach user
                package_id: 1, // Basic Fitness
                motivational_message: 'Every journey begins with a single step!',
                motivational_message_ar: 'كل رحلة تبدأ بخطوة واحدة!',
                is_template: true,
                is_Active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                image: 'hiit-cardio.jpg',
                title: 'HIIT Cardio Blast',
                title_ar: 'انفجار كارديو عالي الكثافة',
                type: 'group',
                difficulty_level: 'Intermediate',
                description: 'High-intensity interval training for fat burning',
                description_ar: 'تدريب متقطع عالي الكثافة لحرق الدهون',
                duration: 30,
                coach: 2,
                package_id: 2, // Premium Personal
                motivational_message: 'Push your limits and break barriers!',
                motivational_message_ar: 'ادفع حدودك واكسر الحواجز!',
                is_template: true,
                is_Active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                image: 'strength-upper.jpg',
                title: 'Upper Body Strength',
                title_ar: 'قوة الجزء العلوي',
                type: 'personalized',
                difficulty_level: 'Advanced',
                description: 'Focus on building upper body muscle and strength',
                description_ar: 'التركيز على بناء عضلات وقوة الجزء العلوي',
                duration: 60,
                coach: 2,
                package_id: 3, // Elite Group
                motivational_message: 'Strength grows in the moments you think you cannot go on!',
                motivational_message_ar: 'تنمو القوة في اللحظات التي تعتقد فيها أنك لا تستطيع المتابعة!',
                is_template: true,
                is_Active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                image: 'core-crusher.jpg',
                title: 'Core Crusher',
                title_ar: 'محطم الجذع',
                type: 'group',
                difficulty_level: 'Intermediate',
                description: 'Intense core workout for abdominal strength',
                description_ar: 'تمرين جذع مكثف لقوة البطن',
                duration: 25,
                coach: 2,
                package_id: 1, // Basic Fitness
                motivational_message: 'Your core is your powerhouse!',
                motivational_message_ar: 'جذعك هو مصدر قوتك!',
                is_template: true,
                is_Active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                image: 'flexibility-flow.jpg',
                title: 'Flexibility Flow',
                title_ar: 'تدفق المرونة',
                type: 'group',
                difficulty_level: 'Beginner',
                description: 'Improve flexibility and mobility',
                description_ar: 'تحسين المرونة والحركة',
                duration: 30,
                coach: 2,
                package_id: 1, // Basic Fitness
                motivational_message: 'Flexibility is the key to longevity!',
                motivational_message_ar: 'المرونة هي مفتاح طول العمر!',
                is_template: true,
                is_Active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('workouts', null, {});
    }
};

