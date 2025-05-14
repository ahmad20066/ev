'use strict';

const sequelize = require('../models');

async function runSeeders() {
    try {
        console.log('Starting to run seeders...');

        // Run seeders in order
        const seeders = [
            '01-seed-sports.js',
            '02-seed-users.js',
            '03-seed-content.js',
            '04-seed-types.js',
            '05-seed-ingredients.js',
            '06-seed-meals.js',
            '07-seed-meal-plans.js',
            '08-seed-delivery-times.js',
            '09-seed-packages.js',
            '10-seed-exercises.js',
            '11-seed-workouts.js',
            '12-seed-workout-exercises.js',
            '13-seed-surveys.js',
            '14-seed-relationships.js'
        ];

        for (const seeder of seeders) {
            console.log(`Running ${seeder}...`);
            const seederModule = require(`./${seeder}`);
            await seederModule.up(sequelize.getQueryInterface(), sequelize.Sequelize);
            console.log(`✅ ${seeder} completed`);
        }

        console.log('🎉 All seeders completed successfully!');
    } catch (error) {
        console.error('❌ Error running seeders:', error);
    } finally {
        await sequelize.close();
    }
}

runSeeders();
