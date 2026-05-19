const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: [String],
    answers: [String],
    evaluations: [String],
    scores: [Number],
    confidences: [Number],
    topicLabels: [String],
    responseTimes: [Number],
    status: {
        type: String,
        default: 'active' // active, completed
    },
    currentStep: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['interview', 'aptitude'],
        default: 'interview'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Session', SessionSchema);
