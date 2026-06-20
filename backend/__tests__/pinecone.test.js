const { getPineconeIndex, upsertResumeChunks, queryResumeChunks } = require('../utils/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');

jest.mock('@pinecone-database/pinecone', () => {
    const mockUpsert = jest.fn();
    const mockQuery = jest.fn();
    const mockIndex = jest.fn().mockReturnValue({
        upsert: mockUpsert,
        query: mockQuery
    });
    return {
        Pinecone: jest.fn().mockImplementation(() => ({
            index: mockIndex
        })),
        _mockUpsert: mockUpsert,
        _mockQuery: mockQuery,
        _mockIndex: mockIndex
    };
});

const pineconeMock = require('@pinecone-database/pinecone');

describe('Pinecone Utils', () => {
    beforeEach(() => {
        process.env.PINECONE_API_KEY = 'mock_key';
        process.env.PINECONE_INDEX = 'mock_index';
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete process.env.PINECONE_API_KEY;
        delete process.env.PINECONE_INDEX;
    });

    it('should throw if PINECONE_API_KEY is not defined', () => {
        delete process.env.PINECONE_API_KEY;
        expect(() => getPineconeIndex()).toThrow('PINECONE_API_KEY is not defined in environment variables');
    });

    it('should upsert resume chunks wrapped in records object', async () => {
        const resumeId = 'resume123';
        const userId = 'user456';
        const chunks = [
            { text: 'Hello world', embedding: [0.1, 0.2] }
        ];

        await upsertResumeChunks(resumeId, userId, chunks);

        expect(pineconeMock.Pinecone).toHaveBeenCalledWith({ apiKey: 'mock_key' });
        expect(pineconeMock._mockIndex).toHaveBeenCalledWith('mock_index');
        expect(pineconeMock._mockUpsert).toHaveBeenCalledWith({
            records: [
                {
                    id: 'resume123_chunk_0',
                    values: [0.1, 0.2],
                    metadata: {
                        resumeId: 'resume123',
                        userId: 'user456',
                        text: 'Hello world'
                    }
                }
            ]
        });
    });

    it('should query resume chunks with vector and topK parameters', async () => {
        const queryVector = [0.5, 0.6];
        const mockMatches = [{ id: 'match1', score: 0.9, metadata: { text: 'Matched' } }];
        pineconeMock._mockQuery.mockResolvedValue({ matches: mockMatches });

        const results = await queryResumeChunks(queryVector, 3, { userId: 'user456' });

        expect(pineconeMock._mockQuery).toHaveBeenCalledWith({
            vector: queryVector,
            topK: 3,
            includeMetadata: true,
            filter: { userId: 'user456' }
        });
        expect(results).toEqual(mockMatches);
    });
});
