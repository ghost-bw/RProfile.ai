const { aptitudeResponseFormat, parseAptitudeQuestions } = require('../utils/aptitude');

const makeQuestion = (overrides = {}) => ({
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    topic: 'Arithmetic',
    explanation: '4 is correct because 2 + 2 equals 4.',
    ...overrides
});

const makePayload = (questions = Array.from({ length: 20 }, () => makeQuestion())) =>
    JSON.stringify({ questions });

describe('aptitude response formatting and validation', () => {
    it('requests strict JSON-schema output with the required question fields', () => {
        expect(aptitudeResponseFormat.type).toBe('json_schema');
        expect(aptitudeResponseFormat.json_schema.strict).toBe(true);
        expect(aptitudeResponseFormat.json_schema.schema.properties.questions.items.required)
            .toEqual(['question', 'options', 'correctAnswer', 'topic', 'explanation']);
    });

    it('parses and returns exactly 20 valid questions', () => {
        const questions = parseAptitudeQuestions(makePayload());

        expect(questions).toHaveLength(20);
        expect(questions[0]).toEqual(makeQuestion());
    });

    it.each([
        ['', 'empty response'],
        ['not json', 'invalid JSON'],
        [JSON.stringify({ questions: [] }), 'exactly 20'],
        [makePayload([makeQuestion({ options: ['A', 'B', 'C'] }), ...Array.from({ length: 19 }, () => makeQuestion())]), 'invalid question at position 1']
    ])('rejects malformed model output (%s)', (content, errorMessage) => {
        expect(() => parseAptitudeQuestions(content)).toThrow(errorMessage);
    });

    it('preserves the indexed answer instead of inferring it from explanation text', () => {
        const questions = parseAptitudeQuestions(makePayload([
            makeQuestion({
                options: ['4', '3', '5', '6'],
                correctAnswer: 0,
                explanation: '4 is correct because 2 + 2 equals 4.'
            }),
            ...Array.from({ length: 19 }, () => makeQuestion())
        ]));

        expect(questions[0].correctAnswer).toBe(0);
    });
});
