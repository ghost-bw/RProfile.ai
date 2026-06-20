const { Pinecone } = require('@pinecone-database/pinecone');

let pc;
let index;

/**
 * Initializes and returns the Pinecone index client.
 */
const getPineconeIndex = () => {
    if (!pc) {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY is not defined in environment variables');
        }
        pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    const indexName = process.env.PINECONE_INDEX || 'resumepro';
    if (!index) {
        index = pc.index(indexName);
    }
    return index;
};

/**
 * Upsert chunks of a resume into Pinecone.
 * @param {string} resumeId - MongoDB ID of the Resume document
 * @param {string} userId - MongoDB ID of the User document
 * @param {Array<{text: string, embedding: number[]}>} embeddedChunks - Array of text chunks with their embedding vectors
 */
const upsertResumeChunks = async (resumeId, userId, embeddedChunks) => {
    try {
        const pineconeIndex = getPineconeIndex();
        
        const records = embeddedChunks.map((chunk, idx) => ({
            id: `${resumeId}_chunk_${idx}`,
            values: chunk.embedding,
            metadata: {
                resumeId: resumeId.toString(),
                userId: userId.toString(),
                text: chunk.text
            }
        }));

        console.log(`Upserting ${records.length} chunks to Pinecone index...`);
        // Pinecone upsert accepts batches of records
        await pineconeIndex.upsert({ records });
        console.log('Upsert to Pinecone complete successfully.');
    } catch (error) {
        console.error('Pinecone upsert error:', error.message);
        throw error;
    }
};

/**
 * Query Pinecone for similar chunks.
 * @param {number[]} queryVector - Query embedding vector
 * @param {number} limit - Maximum number of matches to return
 * @param {object} filter - Pinecone metadata filter (e.g. { userId: "someUserId" })
 */
const queryResumeChunks = async (queryVector, limit = 5, filter = {}) => {
    try {
        const pineconeIndex = getPineconeIndex();
        const response = await pineconeIndex.query({
            vector: queryVector,
            topK: limit,
            includeMetadata: true,
            filter: filter
        });
        return response.matches || [];
    } catch (error) {
        console.error('Pinecone query error:', error.message);
        throw error;
    }
};

module.exports = {
    getPineconeIndex,
    upsertResumeChunks,
    queryResumeChunks
};
