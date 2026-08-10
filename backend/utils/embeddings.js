let embedder;
let pipeline;

const getEmbedder = async () => {
    if (!embedder) {
        if (!pipeline) {
            const transformers = require('@xenova/transformers');
            pipeline = transformers.pipeline;
        }
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
};

const generateEmbedding = async (text) => {
    const embed = await getEmbedder();
    const output = await embed(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};

const chunkText = (text, size = 500, overlap = 100) => {
    if (!text || typeof text !== 'string') return [];
    if (size <= overlap) throw new Error('chunk size must be greater than overlap');
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        let end = start + size;
        chunks.push(text.slice(start, end));
        if (end >= text.length) break;
        start = end - overlap;
    }
    return chunks;
};

module.exports = { generateEmbedding, chunkText };
