const TOPIC_CATEGORIES = [
    {
        name: 'Quantitative Aptitude',
        pattern: /\b(quantitative|math(?:ematics)?|arithmetic|algebra|probability|combinatorics|statistics|number theory|geometry|percentage|ratio|profit and loss|time and work|speed and distance)\b/i
    },
    {
        name: 'Data Interpretation',
        pattern: /\b(data interpretation|data analysis|charts?|tables?|graphs? interpretation|data visualization)\b/i
    },
    {
        name: 'Logical Reasoning',
        pattern: /\b(logical|reasoning|puzzles?|deduction|induction|syllogisms?|sequences?|arrangements?|critical thinking)\b/i
    },
    {
        name: 'Programming & Algorithms',
        pattern: /\b(programming|coding|algorithms?|data structures?|binary search|graphs?|trees?|arrays?|linked lists?|stacks?|queues?|dynamic programming|recursion|complexity|two pointers|tries)\b/i
    },
    {
        name: 'Computer Science Fundamentals',
        pattern: /\b(computer science|operating systems?|databases?|sql|networking|system design|cloud|cybersecurity|security|oop|object[- ]oriented|software engineering|apis?|architecture)\b/i
    },
    {
        name: 'Communication & Behavioral',
        pattern: /\b(communication|verbal|writing|grammar|presentation|behavioral|behavioural|leadership|teamwork|conflict|situational|introduction|interpersonal)\b/i
    }
];

const categorizeTopic = (topic) => {
    const label = typeof topic === 'string' ? topic.trim() : '';
    const category = TOPIC_CATEGORIES.find(({ pattern }) => pattern.test(label));
    return category ? category.name : 'Domain Knowledge';
};

const aggregateTopicPerformance = (sessions) => {
    const totals = new Map();

    sessions.forEach(session => {
        if (!Array.isArray(session.topicLabels) || !Array.isArray(session.scores)) return;

        session.topicLabels.forEach((topic, index) => {
            const score = Number(session.scores[index]);
            if (!Number.isFinite(score)) return;

            const category = categorizeTopic(topic);
            const total = totals.get(category) || { score: 0, count: 0 };
            total.score += score;
            total.count += 1;
            totals.set(category, total);
        });
    });

    return Object.fromEntries(
        Array.from(totals, ([category, total]) => [category, total.score / total.count])
    );
};

module.exports = { categorizeTopic, aggregateTopicPerformance };
