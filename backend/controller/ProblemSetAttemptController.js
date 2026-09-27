import ProblemSet from '../models/ProblemSet.js';
import ProblemSetAttempt from '../models/ProblemSetAttempt.js';
import { getClassAccess, sendError } from '../utils/ClassAccess.js';

//Loads the set and checks it's published and the caller is a student in the class.
const loadPublishedSet = async (req) => {
    const access = await getClassAccess(req.params.id, req.user);
    if (access.error) return access;
    if (req.user.role !== 'student') return { status: 403, error: "Only students can attempt problem sets." };

    const set = await ProblemSet.getById(req.params.setId);
    if (!set || set.class_id !== access.classroom.id || set.status !== 'published') {
        return { status: 404, error: "Problem set not found." };
    }

    return { set };
};

//Get the questions to attempt, or say the student already has an attempt: GET /api/classes/:id/problem-sets/:setId/attempt
export const getAttemptView = async (req, res, next) => {
    try {
        const result = await loadPublishedSet(req);
        if (result.error) return sendError(res, result.status, result.error);

        const existing = await ProblemSetAttempt.getByUser(result.set.id, req.user.id);
        if (existing) {
            return res.status(200).json({
                success: true,
                message: "You have already attempted this problem set.",
                data: { alreadyAttempted: true, attemptId: existing.id },
                statusCode: 200
            });
        }

        const questions = await ProblemSetAttempt.getQuestionsForAttempt(result.set.id);

        res.status(200).json({
            success: true,
            message: "Problem set retrieved successfully.",
            data: { alreadyAttempted: false, title: result.set.title, questions },
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the attempt view at the controller due to: " + error);
        next(error);
    }
};

//Submit the student's answers: POST /api/classes/:id/problem-sets/:setId/attempt  body: { answers: [{ questionId, optionId }] }
export const submitAttempt = async (req, res, next) => {
    try {
        const result = await loadPublishedSet(req);
        if (result.error) return sendError(res, result.status, result.error);

        const answers = Array.isArray(req.body.answers)
            ? req.body.answers
                .map((a) => ({ questionId: Number(a.questionId), optionId: a.optionId != null ? Number(a.optionId) : null }))
                .filter((a) => Number.isInteger(a.questionId))
            : [];

        const outcome = await ProblemSetAttempt.submit(result.set.id, req.user.id, answers);
        if (outcome === 'already_attempted') return sendError(res, 409, "You have already attempted this problem set.");

        //Score is graded and stored, but never sent back to the student — only the fact that it saved.
        res.status(201).json({
            success: true,
            message: "Answers submitted successfully.",
            data: { attemptId: outcome.attemptId },
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to submit the attempt at the controller due to: " + error);
        next(error);
    }
};

//Lets the student review what they chose, never whether it was right or what they scored — those fields are
//stripped here, at the API level, not just hidden in the UI (the same reason getProblemSetDetail strips
//is_correct for students: a Network tab is enough to defeat a UI-only hide).
export const getAttemptResult = async (req, res, next) => {
    try {
        const result = await loadPublishedSet(req);
        if (result.error) return sendError(res, result.status, result.error);

        const existing = await ProblemSetAttempt.getByUser(result.set.id, req.user.id);
        if (!existing) return sendError(res, 404, "You have not attempted this problem set yet.");

        const { breakdown } = await ProblemSetAttempt.getResult(existing.id, req.user.id);

        const questions = breakdown.map((q) => ({
            id: q.id,
            position: q.position,
            title: q.title,
            description: q.description,
            selectedOptionId: q.selectedOptionId,
            options: q.options.map(({ id, option_text }) => ({ id, option_text }))
        }));

        res.status(200).json({
            success: true,
            message: "Your answers retrieved successfully.",
            data: { questions },
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the attempt result at the controller due to: " + error);
        next(error);
    }
};
