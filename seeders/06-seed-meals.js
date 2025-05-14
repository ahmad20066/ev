'use strict';
const { getMealImage } = require('./helpers/image-helper');

module.exports = {
    async up(queryInterface, Sequelize) {
        const meals = [
            {
                name: 'Protein Power Bowl',
                name_ar: 'وعاء البروتين',
                description: 'Grilled chicken breast with quinoa and steamed broccoli',
                description_ar: 'صدر دجاج مشوي مع الكينوا والبروكلي المطبوخ على البخار',
                calories: 450.5,
                protein: 40.0,
                carb: 30.0,
                fats: 15.0,
                fiber: 5.0,
                images: JSON.stringify(getMealImage('Protein Power Bowl')),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Overnight Oats',
                name_ar: 'شوفان ليلي',
                description: 'Healthy overnight oats with Greek yogurt and berries',
                description_ar: 'شوفان صحي مع الزبادي اليوناني والتوت',
                calories: 320.0,
                protein: 18.0,
                carb: 45.0,
                fats: 8.0,
                fiber: 8.0,
                images: JSON.stringify(getMealImage('Overnight Oats')),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Baked Salmon Dinner',
                name_ar: 'عشاء السلمون المخبوز',
                description: 'Herb-crusted salmon with roasted sweet potato',
                description_ar: 'سلمون بالأعشاب مع بطاطا حلوة محمصة',
                calories: 520.0,
                protein: 35.0,
                carb: 35.0,
                fats: 25.0,
                fiber: 4.0,
                images: JSON.stringify(getMealImage('Baked Salmon Dinner')),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Pre-Workout Energy',
                name_ar: 'طاقة ما قبل التمرين',
                description: 'Quick energy boost with banana and oats',
                description_ar: 'دفعة طاقة سريعة بالموز والشوفان',
                calories: 280.0,
                protein: 8.0,
                carb: 50.0,
                fats: 5.0,
                fiber: 6.0,
                images: JSON.stringify(getMealImage('Pre-Workout Energy')),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Post-Workout Recovery',
                name_ar: 'استشفاء ما بعد التمرين',
                description: 'Protein-rich meal for recovery',
                description_ar: 'وجبة غنية بالبروتين للاستشفاء',
                calories: 350.0,
                protein: 30.0,
                carb: 30.0,
                fats: 10.0,
                fiber: 3.0,
                images: JSON.stringify(getMealImage('Post-Workout Recovery')),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await queryInterface.bulkInsert('Meals', meals);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Meals', null, {});
    }
};
