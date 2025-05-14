'use strict';
const { getExerciseImages, getRandomExerciseMuscleImage } = require('./helpers/image-helper');

module.exports = {
    async up(queryInterface, Sequelize) {
        const exercises = [
            {
                name: 'Push Up',
                name_ar: 'ضغط',
                description: 'Upper body strength exercise targeting chest, shoulders, and triceps',
                description_ar: 'تمرين قوة الجزء العلوي يستهدف الصدر والأكتاف والعضلة ثلاثية الرؤوس',
                image_urls: JSON.stringify(getExerciseImages('Push Up')),
                target_muscles_image: 'https://images.unsplash.com/photo-1578836537282-3171d77f8632?w=500&q=80',
                notes: JSON.stringify(['Keep your body straight', 'Lower until chest nearly touches floor']),
                notes_ar: JSON.stringify(['حافظ على استقامة جسمك', 'انزل حتى يكاد صدرك يلامس الأرض']),
                cooling_time: 60.0,
                video_url: 'https://example.com/pushup-video',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Squat',
                name_ar: 'قرفصاء',
                description: 'Lower body compound exercise',
                description_ar: 'تمرين مركب للجزء السفلي',
                image_urls: JSON.stringify(getExerciseImages('Squat')),
                target_muscles_image: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=500&q=80',
                notes: JSON.stringify(['Keep feet shoulder-width apart', 'Lower until thighs parallel to floor']),
                notes_ar: JSON.stringify(['اجعل قدميك على مسافة عرض الكتفين', 'انزل حتى تصبح فخذيك موازية للأرض']),
                cooling_time: 90.0,
                video_url: 'https://example.com/squat-video',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Deadlift',
                name_ar: 'رفعة ميتة',
                description: 'Full body compound exercise',
                description_ar: 'تمرين مركب للجسم كامل',
                image_urls: JSON.stringify(getExerciseImages('Deadlift')),
                target_muscles_image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80',
                notes: JSON.stringify(['Keep back straight', 'Drive through heels']),
                notes_ar: JSON.stringify(['حافظ على استقامة الظهر', 'ادفع من خلال الكعبين']),
                cooling_time: 120.0,
                video_url: 'https://example.com/deadlift-video',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Plank',
                name_ar: 'لوح',
                description: 'Core stability exercise',
                description_ar: 'تمرين ثبات الجذع',
                image_urls: JSON.stringify(getExerciseImages('Plank')),
                target_muscles_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80',
                notes: JSON.stringify(['Keep body in straight line', 'Engage core throughout']),
                notes_ar: JSON.stringify(['حافظ على استقامة الجسم', 'شد عضلات الجذع طوال الوقت']),
                cooling_time: 30.0,
                video_url: 'https://example.com/plank-video',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Burpee',
                name_ar: 'بيربي',
                description: 'Full body high-intensity exercise',
                description_ar: 'تمرين عالي الكثافة للجسم كامل',
                image_urls: JSON.stringify(getExerciseImages('Burpee')),
                target_muscles_image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&q=80',
                notes: JSON.stringify(['Move quickly between positions', 'Jump with arms overhead']),
                notes_ar: JSON.stringify(['تحرك بسرعة بين الأوضاع', 'اقفز مع رفع الذراعين']),
                cooling_time: 90.0,
                video_url: 'https://example.com/burpee-video',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Mountain Climbers',
                name_ar: 'متسلق الجبال',
                description: 'Cardio and core exercise',
                description_ar: 'تمرين كارديو وجذع',
                image_urls: JSON.stringify(getExerciseImages('Mountain Climbers')),
                target_muscles_image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80',
                notes: JSON.stringify(['Keep hips level', 'Alternate legs quickly']),
                notes_ar: JSON.stringify(['حافظ على مستوى الوركين', 'بدل الساقين بسرعة']),
                cooling_time: 60.0,
                video_url: 'https://example.com/mountain-climber-video',
                is_active: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        await queryInterface.bulkInsert('exercises', exercises);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('exercises', null, {});
    }
};

