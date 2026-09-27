import { getBlanks } from './questionTypes';

//Same text without any tags, so an empty "<p></p>" from the rich text editor doesn't count as a real description.
export const toPlainText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const hasDescription = (html) => !!toPlainText(html || '') || (html || '').includes('<img');

//Mirrors the checks in publishProblemSet (backend), so Confirm can tell the lecturer what is missing before
//anything is written to the database. The backend still re-checks everything when it actually publishes.
//questions = [{ id, type, title, points, description, options: [{ text, isCorrect }], files }]
//achievement = null when switched off, otherwise { title, description, minPoints, expiryDate, imagePreviewUrl }
//scope says where the issue is shown: on a question card, on the achievement card, or on the set as a whole.
export const getPublishIssues = (questions, achievement) => {
    if (questions.length === 0) {
        return [{ scope: 'set', questionId: null, questionNumber: null, questionTitle: null, message: "Add at least one question before publishing." }];
    }

    const issues = [];
    const addIssue = (q, index, message) => issues.push({
        scope: q ? 'question' : 'achievement',
        questionId: q?.id ?? null,
        questionNumber: q ? index + 1 : null,
        questionTitle: q ? (q.title?.trim() || 'Untitled Question') : null,
        message
    });

    questions.forEach((q, index) => {
        if (!q.title.trim()) addIssue(q, index, "This question needs a title.");
        if (achievement && (q.points === '' || q.points == null)) {
            addIssue(q, index, "This question needs a points value because the set has an achievement.");
        }

        if (q.type === 'fill_blank') {
            const blanks = getBlanks(q.description);
            if (blanks.length === 0) {
                addIssue(q, index, "Highlight at least one word or phrase in the passage and turn it into a blank.");
            } else if (blanks.some((text) => !text)) {
                addIssue(q, index, "Every blank needs some text in it.");
            }
        } else if (q.type === 'open_ended') {
            if (!hasDescription(q.description) && !(q.files || []).length) {
                addIssue(q, index, "Add a description or attach a file so students know what to answer.");
            }
        } else {
            const options = q.options.filter((o) => o.text.trim());
            if (hasDescription(q.description) && options.length <= 1) {
                addIssue(q, index, "This question has a description, so it needs more than one answer option.");
            }
            if (options.length > 0 && !options.some((o) => o.isCorrect)) {
                addIssue(q, index, "This question needs one answer option marked correct.");
            }
        }
    });

    if (achievement) {
        const minPoints = achievement.minPoints === '' ? null : Number(achievement.minPoints);
        const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

        if (!achievement.imagePreviewUrl) addIssue(null, null, "The achievement needs a badge image.");
        if (!achievement.title.trim()) addIssue(null, null, "The achievement needs a title.");
        if (!achievement.description.trim()) addIssue(null, null, "The achievement needs a description.");
        if (minPoints == null) addIssue(null, null, "The achievement needs a minimum points value.");
        if (!achievement.expiryDate) addIssue(null, null, "The achievement needs an expiry date.");
        if (minPoints != null && minPoints > totalPoints) {
            addIssue(null, null, `The achievement's minimum (${minPoints}) is higher than the set's total points (${totalPoints}).`);
        }
    }

    return issues;
};
