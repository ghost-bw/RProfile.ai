jest.mock('@xenova/transformers', () => ({
    pipeline: jest.fn()
}));

const { chunkText } = require('../utils/embeddings');

describe('Embeddings Utility - chunkText', () => {
    it('should split text into chunks of specified size', () => {
        const text = 'abcdefghij'; // length 10
        // size = 4, overlap = 1
        // First chunk: start 0, end 4 -> 'abcd'
        // Next chunk starts at: 4 - 1 = 3
        // Second chunk: start 3, end 7 -> 'defg'
        // Next chunk starts at: 7 - 1 = 6
        // Third chunk: start 6, end 10 -> 'ghij'
        const chunks = chunkText(text, 4, 1);
        expect(chunks).toEqual(['abcd', 'defg', 'ghij']);
    });

    it('should return a single chunk if text is smaller than size', () => {
        const text = 'hello';
        const chunks = chunkText(text, 10, 2);
        expect(chunks).toEqual(['hello']);
    });

    it('should handle empty text gracefully', () => {
        const chunks = chunkText('', 10, 2);
        expect(chunks).toEqual([]);
    });
});
