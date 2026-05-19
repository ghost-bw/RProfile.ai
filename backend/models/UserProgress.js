const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    solvedProblems: [
        {
            title: String,
            difficulty: {
                type: String,
                enum: ['Easy', 'Medium', 'Hard'],
                default: 'Medium'
            },
            solvedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    weakTopics: [String],
    strongTopics: [String],
    history: [
        {
            sessionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Session'
            },
            score: Number,
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    lastAccessed: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
