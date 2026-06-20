require('dotenv').config();
const { getPineconeIndex } = require('./utils/pinecone');

async function testPineconeConnection() {
    console.log('--- Testing Pinecone Connection ---');
    console.log('PINECONE_INDEX configured as:', process.env.PINECONE_INDEX || 'resumepro');
    console.log('PINECONE_API_KEY (first 5 chars):', process.env.PINECONE_API_KEY ? process.env.PINECONE_API_KEY.slice(0, 5) + '...' : 'Not Configured');

    try {
        const index = getPineconeIndex();
        console.log('Pinecone index client initialized successfully.');
        
        console.log('Testing upsert connection with object format (records: [...])...');
        try {
            const mockRecord = {
                id: 'test_connection_chunk',
                values: Array(384).fill(0.01),
                metadata: { text: 'Connection validation content' }
            };
            await index.upsert({ records: [mockRecord] });
            console.log('Upsert test successful! Vector database is accepting write operations.');
        } catch (upsertErr) {
            console.error('Upsert test failed:', upsertErr.message);
        }

        console.log('Fetching index statistics...');
        const stats = await index.describeIndexStats();

        
        console.log('\n--- Pinecone Index Stats ---');
        console.log('Dimension:', stats.dimension);
        console.log('Total Vector Count:', stats.totalRecordCount);
        console.log('Namespaces:', JSON.stringify(stats.namespaces, null, 2));
        console.log('----------------------------');
        console.log('\nPinecone connection is WORKING perfectly!');
    } catch (error) {
        console.error('\n--- Pinecone Connection FAILED ---');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('---------------------------------');
        console.error('\nPlease verify that your PINECONE_API_KEY and PINECONE_INDEX are correct in backend/.env.');
    }
}

testPineconeConnection();
