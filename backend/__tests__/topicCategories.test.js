const { categorizeTopic, aggregateTopicPerformance } = require('../utils/topicCategories');

describe('topic mastery categories', () => {
    it.each([
        ['Probability', 'Quantitative Aptitude'],
        ['Data Interpretation - Charts', 'Data Interpretation'],
        ['Logical Reasoning', 'Logical Reasoning'],
        ['Dynamic Programming', 'Programming & Algorithms'],
        ['Operating Systems', 'Computer Science Fundamentals'],
        ['Behavioral Interview', 'Communication & Behavioral'],
        ['Marketing Strategy', 'Domain Knowledge']
    ])('classifies %s into %s', (topic, expectedCategory) => {
        expect(categorizeTopic(topic)).toBe(expectedCategory);
    });

    it('aggregates category scores using all question scores, not label averages', () => {
        const sessions = [
            { topicLabels: ['Probability', 'Algebra'], scores: [10, 6] },
            { topicLabels: ['Combinatorics', 'Operating Systems'], scores: [8, 4] }
        ];

        expect(aggregateTopicPerformance(sessions)).toEqual({
            'Quantitative Aptitude': 8,
            'Computer Science Fundamentals': 4
        });
    });
});
