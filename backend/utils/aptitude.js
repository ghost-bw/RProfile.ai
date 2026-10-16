const aptitudeResponseFormat = {
    type: 'json_schema',
    json_schema: {
        name: 'aptitude_questions',
        strict: true,
        schema: {
            type: 'object',
            properties: {
                questions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            question: { type: 'string' },
                            options: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            correctAnswer: {
                                type: 'integer',
                                enum: [0, 1, 2, 3]
                            },
                            topic: { type: 'string' },
                            explanation: { type: 'string' }
                        },
                        required: ['question', 'options', 'correctAnswer', 'topic', 'explanation'],
                        additionalProperties: false
                    }
                }
            },
            required: ['questions'],
            additionalProperties: false
        }
    }
};

const parseAptitudeQuestions = (content) => {
    if (typeof content !== 'string' || !content.trim()) {
        throw new Error('The aptitude model returned an empty response.');
    }

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error('The aptitude model returned invalid JSON.');
    }

    if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length !== 20
    ) {
        throw new Error('The aptitude model response must contain exactly 20 questions.');
    }

    return parsed.questions.map((question, index) => {
        if (
            !question ||
            typeof question !== 'object' ||
            Array.isArray(question) ||
            typeof question.question !== 'string' ||
            !question.question.trim() ||
            !Array.isArray(question.options) ||
            question.options.length !== 4 ||
            question.options.some(option => typeof option !== 'string' || !option.trim()) ||
            !Number.isInteger(question.correctAnswer) ||
            question.correctAnswer < 0 ||
            question.correctAnswer > 3 ||
            typeof question.topic !== 'string' ||
            !question.topic.trim() ||
            typeof question.explanation !== 'string' ||
            !question.explanation.trim()
        ) {
            throw new Error(`The aptitude model returned an invalid question at position ${index + 1}.`);
        }

        return {
            question: question.question.trim(),
            options: question.options.map(option => option.trim()),
            correctAnswer: question.correctAnswer,
            topic: question.topic.trim(),
            explanation: question.explanation.trim()
        };
    });
};

module.exports = { aptitudeResponseFormat, parseAptitudeQuestions };
