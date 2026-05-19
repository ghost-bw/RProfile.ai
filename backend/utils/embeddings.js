const { pipeline } = require('@xenova/transformers');

let embedder;

const getEmbedder = async () => {
    if (!embedder) {
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
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        let end = start + size;
        chunks.push(text.slice(start, end));
        start = end - overlap;
    }
    return chunks;
};

module.exports = { generateEmbedding, chunkText };
