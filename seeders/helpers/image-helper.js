'use strict';

// Real Unsplash image URLs for different types
const MEAL_IMAGES = [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', // Protein bowl
    'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500&q=80', // Healthy bowl 2
    'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&q=80', // Overnight oats
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80', // Baked salmon
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&q=80', // Pre-workout meal
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&q=80', // Post-workout
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&q=80', // Healthy salad
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&q=80', // Grilled chicken
    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&q=80', // Quinoa bowl
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80'  // Fish dinner
];

const EXERCISE_IMAGES = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80', // Push-ups
    'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=500&q=80', // Squats
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80', // Deadlifts
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80', // Planks
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&q=80', // Burpees
    'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80', // Mountain climbers
    'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=500&q=80', // General workout
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80', // Fitness training
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80', // Strength training
    'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=500&q=80'  // Exercise form
];

const EXERCISE_MUSCLE_IMAGES = [
    'https://images.unsplash.com/photo-1578836537282-3171d77f8632?w=500&q=80', // Muscle diagram 1
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&q=80', // Muscle diagram 2
    'https://images.unsplash.com/photo-1606889464198-fcb18894cf04?w=500&q=80', // Anatomy chart
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80', // Body muscles
    'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=500&q=80', // Lower body
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80'  // Upper body
];

const INGREDIENT_IMAGES = [
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80', // Chicken breast
    'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&q=80', // Brown rice
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=500&q=80', // Broccoli
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80', // Salmon
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80', // Sweet potato
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80', // Eggs
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', // Quinoa
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80', // Avocado
    'https://images.unsplash.com/photo-1571212515416-d6ca50b9a4d9?w=500&q=80', // Greek yogurt
    'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&q=80'  // Oats
];

// Helper functions
function getRandomMealImages(count = 1) {
    const shuffled = [...MEAL_IMAGES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomExerciseImages(count = 1) {
    const shuffled = [...EXERCISE_IMAGES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomExerciseMuscleImage() {
    return EXERCISE_MUSCLE_IMAGES[Math.floor(Math.random() * EXERCISE_MUSCLE_IMAGES.length)];
}

function getRandomIngredientImage() {
    return INGREDIENT_IMAGES[Math.floor(Math.random() * INGREDIENT_IMAGES.length)];
}

function getSequentialImage(array, index) {
    return array[index % array.length];
}

// Specific image mappings for better accuracy
function getMealImage(mealName) {
    const mappings = {
        'Protein Power Bowl': ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500&q=80'],
        'Overnight Oats': ['https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&q=80'],
        'Baked Salmon Dinner': ['https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80'],
        'Pre-Workout Energy': ['https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&q=80'],
        'Post-Workout Recovery': ['https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&q=80']
    };
    return mappings[mealName] || getRandomMealImages(1);
}

function getExerciseImages(exerciseName) {
    const mappings = {
        'Push Up': ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80', 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=500&q=80'],
        'Squat': ['https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=500&q=80', 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=500&q=80'],
        'Deadlift': ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80'],
        'Plank': ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80'],
        'Burpee': ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&q=80', 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80'],
        'Mountain Climbers': ['https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&q=80']
    };
    return mappings[exerciseName] || getRandomExerciseImages(2);
}

function getIngredientImage(ingredientName) {
    const mappings = {
        'Chicken Breast': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80',
        'Brown Rice': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&q=80',
        'Broccoli': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=500&q=80',
        'Salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80',
        'Sweet Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80',
        'Eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80',
        'Quinoa': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
        'Avocado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80',
        'Greek Yogurt': 'https://images.unsplash.com/photo-1571212515416-d6ca50b9a4d9?w=500&q=80',
        'Oats': 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500&q=80'
    };
    return mappings[ingredientName] || getRandomIngredientImage();
}

module.exports = {
    MEAL_IMAGES,
    EXERCISE_IMAGES,
    EXERCISE_MUSCLE_IMAGES,
    INGREDIENT_IMAGES,
    getRandomMealImages,
    getRandomExerciseImages,
    getRandomExerciseMuscleImage,
    getRandomIngredientImage,
    getSequentialImage,
    getMealImage,
    getExerciseImages,
    getIngredientImage
}; 