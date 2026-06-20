const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalText: String,
    chunks: [{
        text: String
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

// Chunks are stored without embedding vectors to keep MongoDB document size small.
// The vector embeddings are offloaded to Pinecone for scalable similarity searches.

module.exports = mongoose.model('Resume', ResumeSchema);
