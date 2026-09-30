import sanitizeHTML from 'sanitize-html';
import ProblemSetSubmission from '../models/ProblemSetSubmission.js';
import { roundPoints } from '../utils/ProblemSetGrading.js';
import { getClassAccess, sendError, COMMENT_CLEAN_OPTIONS } from '../utils/ClassAccess.js';

//Same text without any tags, so an empty <p></p> does not count as a comment.
const toPlainText = (html) =>
    sanitizeHTML(html.replace(/<\/(p|li|h[1-3]|blockquote)>/gi, ' '), { allowedTags: [], allowedAttributes: {} }).trim();

//Cleans the lecturer's comments and keeps only non-empty ones on this set's questions.
const readComments = (raw, questionIds) => (Array.isArray(raw) ? raw : [])
    .map((c) => ({ questionId: Number(c.questionId), content: sanitizeHTML(c.content || '', COMMENT_CLEAN_OPTIONS) }))
    .filter((c) => questionIds.has(c.questionId) && toPlainText(c.content));

//Staff can open any submission in their class. With allowStudent, a student may open their OWN submission, and
//only once it has been graded; anyone else's is simply "not found".
const loadAttempt = async (req, { allowStudent = false } = {}) => {
    const access = await getClassAccess(req.params.id, req.user);
    if (access.error) return access;

    const attempt = await ProblemSetSubmission.getAttempt(req.params.attemptId);
    if (!attempt || attempt.class_id !== access.classroom.id) return { status: 404, error: "Submission not found." };

    if (!access.canManage) {
        if (!allowStudent) return { status: 403, error: "Only lecturer, parents or admin can grade submissions." };
        if (attempt.user_id !== req.user.id) return { status: 404, error: "Submission not found." };
        if (attempt.status !== 'graded') return { status: 403, error: "This submission hasn't been graded yet." };
    }

    return { ...access, attempt };
};

//Staff see every student's submission with its score; a student sees only their own, without any marks.
//GET /api/classes/:id/submissions?assessment=&name=&startDate=&endDate=
export const getSubmissions = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        const { assessment, name, startDate, endDate } = req.query;
        const rows = await ProblemSetSubmission.listForClass(access.classroom.id, {
            assessment, startDate, endDate,
            name: access.canManage ? name : undefined,
            userId: access.canManage ? undefined : req.user.id
        });

        const data = access.canManage
            ? rows
            : rows.map(({ id, problem_set_id, assessment: title, status, submitted_at, score, total_points }) => ({
                id, problem_set_id, assessment: title, status, submitted_at,
                //Results are released to the student only once the lecturer has graded the submission.
                ...(status === 'graded' ? { score, total_points } : {})
            }));

        res.status(200).json({ success: true, message: "Submissions retrieved successfully.", data, statusCode: 200 });

    } catch (error) {
        console.error("Fail to get the submissions at the controller due to: " + error);
        next(error);
    }
};

//One student's submission, ready to grade: GET /api/classes/:id/submissions/:attemptId
export const getSubmissionForGrading = async (req, res, next) => {
    try {
        const result = await loadAttempt(req, { allowStudent: true });
        if (result.error) return sendError(res, result.status, result.error);

        const { attempt, canManage } = result;
        const [questions, draft] = await Promise.all([
            ProblemSetSubmission.getGradingDetail(attempt),
            canManage ? ProblemSetSubmission.getGradingDraft(attempt.id) : null
        ]);

        res.status(200).json({
            success: true,
            message: "Submission retrieved successfully.",
            data: {
                attempt: {
                    id: attempt.id,
                    problemSetId: attempt.problem_set_id,
                    assessment: attempt.assessment,
                    studentName: attempt.student_name,
                    submittedAt: attempt.submitted_at,
                    status: attempt.status,
                    score: Number(attempt.score),
                    totalPoints: attempt.total_points,
                    gradedAt: attempt.graded_at,
                    graderName: attempt.grader_name
                },
                //A student's own page loads their private conversation itself (QuestionComments).
                questions: canManage ? questions : questions.map(({ messages, ...q }) => q),
                draft: canManage ? draft : null
            },
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the submission at the controller due to: " + error);
        next(error);
    }
};

//Save the marks (and any new comments) and mark the submission graded: PUT /api/classes/:id/submissions/:attemptId/grade
//body: { marks: [{ questionId, points }], comments: [{ questionId, content }] }
export const gradeSubmission = async (req, res, next) => {
    try {
        const result = await loadAttempt(req);
        if (result.error) return sendError(res, result.status, result.error);

        const questions = await ProblemSetSubmission.getGradingDetail(result.attempt);
        const given = Array.isArray(req.body.marks) ? req.body.marks : [];

        //Every question needs a mark between 0 and its points; a question worth 0 points is simply 0.
        const marks = [];
        for (const [index, q] of questions.entries()) {
            let points = 0;
            if (q.points > 0) {
                const raw = given.find((m) => Number(m.questionId) === q.id)?.points;
                points = raw === '' || raw == null ? NaN : Number(raw);
                if (!Number.isFinite(points) || points < 0 || points > q.points) {
                    return sendError(res, 400, `Question ${index + 1} needs a mark between 0 and ${q.points}.`);
                }
            }
            marks.push({ questionId: q.id, points: roundPoints(points), max: q.points });
        }

        const comments = readComments(req.body.comments, new Set(questions.map((q) => q.id)));
        if (comments.some((c) => c.content.length > 20000)) return sendError(res, 400, "A comment is too long.");

        const saved = await ProblemSetSubmission.saveGrade(result.attempt, marks, comments, req.user.id);

        res.status(200).json({ success: true, message: "Marks saved successfully.", data: saved, statusCode: 200 });

    } catch (error) {
        console.error("Fail to grade the submission at the controller due to: " + error);
        next(error);
    }
};

//Save the marking so far without submitting it: PUT /api/classes/:id/submissions/:attemptId/draft
//body: { marks: [{ questionId, points }], comments: [{ questionId, content }] }
//A mark may be left empty in a draft; one that's filled in must still be between 0 and the question's points.
export const saveGradingDraft = async (req, res, next) => {
    try {
        const result = await loadAttempt(req);
        if (result.error) return sendError(res, result.status, result.error);
        //Drafts are only for the first grading; a graded submission is changed with Update.
        if (result.attempt.status === 'graded') {
            return sendError(res, 409, "This submission is already graded. Use Update to change the marks.");
        }

        const questions = await ProblemSetSubmission.getGradingDetail(result.attempt);
        const given = Array.isArray(req.body.marks) ? req.body.marks : [];

        const marks = {};
        for (const [index, q] of questions.entries()) {
            const raw = given.find((m) => Number(m.questionId) === q.id)?.points;
            if (raw === '' || raw == null) {
                marks[q.id] = null;
                continue;
            }
            const points = Number(raw);
            if (!Number.isFinite(points) || points < 0 || points > q.points) {
                return sendError(res, 400, `Question ${index + 1} needs a mark between 0 and ${q.points}, or leave it empty.`);
            }
            marks[q.id] = roundPoints(points);
        }

        const commentList = readComments(req.body.comments, new Set(questions.map((q) => q.id)));
        if (commentList.some((c) => c.content.length > 20000)) return sendError(res, 400, "A comment is too long.");
        const comments = Object.fromEntries(commentList.map((c) => [c.questionId, c.content]));

        await ProblemSetSubmission.saveGradingDraft(result.attempt.id, marks, comments, req.user.id);
        const draft = await ProblemSetSubmission.getGradingDraft(result.attempt.id);

        res.status(200).json({ success: true, message: "Draft saved.", data: draft, statusCode: 200 });

    } catch (error) {
        console.error("Fail to save the grading draft at the controller due to: " + error);
        next(error);
    }
};
