const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalText: String,
    chunks: [{
        text: String,
        embedding: [Number]
    }],
    atsScore: {
        type: Number,
        default: 0
    },
    improvementTips: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// For MongoDB Atlas Vector Search, we would normally use an index. 
// For this MVP, we'll store embeddings in the document.

module.exports = mongoose.model('Resume', ResumeSchema);
