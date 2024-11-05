const Workout = require('../../models/fitness/workout')
// const WorkoutSession = require('../../models/fitness/workout_session')
const Exercise = require('../../models/fitness/exercise');
const User = require('../../models/user');
// exports.createGroupWorkout = (req, res, next) => {
//     const { title, description, duration } = req.body;

// }
// exports.createWorkout = (req,res,next) => {}
exports.getAllCoaches = async (req, res, next) => {
    try {
        const coaches = await User.findAll({
            where: { role: 'coach', is_active: true },
        });
        res.status(200).json(coaches);
    } catch (error) {
        next(error);
    }
};

exports.getWorkouts = (req, res, next) => {
    Workout.findAll().then(workouts => {
        res.status(200).json(workouts)
    })
}
exports.showWorkout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const workout = await Workout.findByPk(id, {
            include: [
                {
                    model: Exercise,
                    as: "Exercises"
                }
            ]
        })
        if (!workout) {
            const err = new Error("Workout not found")
            err.statusCode = 404;
            next(err)
            return
        }
        res.status(200).json(workout)
    } catch (e) {
        if (!e.statusCode) {
            e.statusCode = 500
        }
        next(e);
    }
}