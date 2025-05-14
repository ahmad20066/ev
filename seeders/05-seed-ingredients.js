'use strict';
const { getIngredientImage } = require('./helpers/image-helper');

module.exports = {
    async up(queryInterface, Sequelize) {
        const ingredients = [
            { title: 'Chicken Breast', title_ar: 'صدر دجاج', image: getIngredientImage('Chicken Breast'), stock: 100, unit: 'g' },
            { title: 'Brown Rice', title_ar: 'أرز بني', image: getIngredientImage('Brown Rice'), stock: 200, unit: 'g' },
            { title: 'Broccoli', title_ar: 'بروكلي', image: getIngredientImage('Broccoli'), stock: 150, unit: 'g' },
            { title: 'Salmon', title_ar: 'سلمون', image: getIngredientImage('Salmon'), stock: 80, unit: 'g' },
            { title: 'Sweet Potato', title_ar: 'بطاطا حلوة', image: getIngredientImage('Sweet Potato'), stock: 120, unit: 'g' },
            { title: 'Eggs', title_ar: 'بيض', image: getIngredientImage('Eggs'), stock: 300, unit: 'piece' },
            { title: 'Quinoa', title_ar: 'كينوا', image: getIngredientImage('Quinoa'), stock: 100, unit: 'g' },
            { title: 'Avocado', title_ar: 'أفوكادو', image: getIngredientImage('Avocado'), stock: 50, unit: 'piece' },
            { title: 'Greek Yogurt', title_ar: 'زبادي يوناني', image: getIngredientImage('Greek Yogurt'), stock: 200, unit: 'g' },
            { title: 'Oats', title_ar: 'شوفان', image: getIngredientImage('Oats'), stock: 250, unit: 'g' }
        ].map((ingredient, index) => ({
            ...ingredient,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await queryInterface.bulkInsert('Ingredients', ingredients);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Ingredients', null, {});
    }
};
