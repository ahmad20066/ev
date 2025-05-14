'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // First seed packages
        await queryInterface.bulkInsert('packages', [
            {
                name: 'Basic Fitness',
                name_ar: 'لياقة أساسية',
                description: 'Essential workouts and nutrition guidance',
                description_ar: 'تمارين أساسية وإرشادات غذائية',
                type: 'group',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Premium Personal',
                name_ar: 'شخصي متقدم',
                description: 'Personalized training with dedicated coach',
                description_ar: 'تدريب شخصي مع مدرب مخصص',
                type: 'personalized',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Elite Group',
                name_ar: 'مجموعة النخبة',
                description: 'Advanced group training sessions',
                description_ar: 'جلسات تدريب جماعي متقدمة',
                type: 'group',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Then seed pricing models
        await queryInterface.bulkInsert('Pricings', [
            // Basic Fitness pricing
            {
                title: 'Basic Monthly',
                title_ar: 'أساسي شهري',
                price: 99.00,
                number_of_days: 30,
                package_id: 1,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Basic Quarterly',
                title_ar: 'أساسي ربع سنوي',
                price: 249.00,
                number_of_days: 90,
                package_id: 1,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Premium Personal pricing
            {
                title: 'Premium Monthly',
                title_ar: 'متقدم شهري',
                price: 199.00,
                number_of_days: 30,
                package_id: 2,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Premium Quarterly',
                title_ar: 'متقدم ربع سنوي',
                price: 499.00,
                number_of_days: 90,
                package_id: 2,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Elite Group pricing
            {
                title: 'Elite Monthly',
                title_ar: 'نخبة شهري',
                price: 149.00,
                number_of_days: 30,
                package_id: 3,
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Pricings', null, {});
        await queryInterface.bulkDelete('packages', null, {});
    }
};
