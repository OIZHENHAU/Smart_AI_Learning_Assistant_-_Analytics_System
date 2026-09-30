export const normaliseAnswer = (text) => String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export const roundPoints = (value) => Math.round(value * 100) / 100;

export const gradeFillBlank = (expected, given, points) => {
    const blanks = expected.map((answer, i) => ({
        answer,
        given: given[i] ?? '',
        correct: normaliseAnswer(answer) === normaliseAnswer(given[i])
    }));
    const correctCount = blanks.filter((b) => b.correct).length;

    return {
        blanks,
        correctCount,
        allCorrect: blanks.length > 0 && correctCount === blanks.length,
        points: blanks.length ? roundPoints((correctCount / blanks.length) * (points || 0)) : 0
    };
};