import sanitizeHtml from 'sanitize-html';
import ProblemSet from '../models/ProblemSet.js';
import ProblemSetAttempt from '../models/ProblemSetAttempt.js';
import { removeAnswerFiles, MAX_FILES_PER_ANSWER } from '../config/problemSetAnswerUpload.js';
import { maskBlanks } from '../utils/ProblemSetBlanks.js';
import { getClassAccess, sendError } from '../utils/ClassAccess.js';

//What an open-ended answer may contain: text formatting only, no images or links.
const ANSWER_CLEAN_OPTIONS = {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'span'],
    allowedAttributes: { span: ['style'] },
    allowedStyles: { span: { 'font-family': [/^[\w\s,'"-]+$/] } }
};

//The answers arrive as a JSON string when the submission is multipart (it has files), or as an array otherwise.
//Returns null when they can't be read at all.
const readAnswers = (raw) => {
    let list = raw;
    if (typeof raw === 'string') {
        try { list = JSON.parse(raw); } catch { return null; }
    }
    if (!Array.isArray(list)) return [];

    return list.map((a) => {
        const text = typeof a.text === 'string' ? sanitizeHtml(a.text, ANSWER_CLEAN_OPTIONS) : '';
        const hasText = !!sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
        return {
            questionId: Number(a.questionId),
            optionId: a.optionId != null ? Number(a.optionId) : null,
            blanks: Array.isArray(a.blanks) ? a.blanks.map((b) => String(b ?? '')) : [],
            text: hasText ? text : null
        };
    }).filter((a) => Number.isInteger(a.questionId));
};

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

//Submit the student's answers: POST /api/classes/:id/problem-sets/:setId/attempt
//multipart: answers = JSON [{ questionId, optionId?, blanks?, text? }], files in fields "file_<questionId>".
//Everything is stored in one go; if anything fails, the uploaded files are removed again.
export const submitAttempt = async (req, res, next) => {
    const uploaded = req.files || [];
    const discardUploads = () => removeAnswerFiles(uploaded.map((f) => f.filename));

    try {
        const result = await loadPublishedSet(req);
        if (result.error) {
            await discardUploads();
            return sendError(res, result.status, result.error);
        }

        const answers = readAnswers(req.body.answers);
        if (answers === null) {
            await discardUploads();
            return sendError(res, 400, "Your answers could not be read. Please try again.");
        }

        //A file is only kept when it belongs to an open-ended question of this set, at most MAX_FILES_PER_ANSWER each.
        const questions = await ProblemSet.getQuestions(result.set.id);
        const openEndedIds = new Set(questions.filter((q) => q.type === 'open_ended').map((q) => q.id));
        const filesByQuestion = {};
        const rejected = [];
        for (const file of uploaded) {
            const questionId = Number(file.fieldname.replace(/^file_/, ''));
            const list = filesByQuestion[questionId] || [];
            if (!file.fieldname.startsWith('file_') || !openEndedIds.has(questionId) || list.length >= MAX_FILES_PER_ANSWER) {
                rejected.push(file.filename);
                continue;
            }
            list.push({ originalName: file.originalname, fileName: file.filename, fileSize: file.size });
            filesByQuestion[questionId] = list;
        }
        await removeAnswerFiles(rejected);

        const outcome = await ProblemSetAttempt.submit(result.set.id, req.user.id, answers, filesByQuestion);
        if (outcome === 'already_attempted') {
            await discardUploads();
            return sendError(res, 409, "You have already attempted this problem set.");
        }

        //Score is graded and stored, but never sent back to the student — only the fact that it saved.
        res.status(201).json({
            success: true,
            message: "Answers submitted successfully.",
            data: { attemptId: outcome.attemptId },
            statusCode: 201
        });

    } catch (error) {
        await discardUploads();
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

        //What the student answered, per question type — never is_correct, the score, or a blank's right answer.
        const questions = breakdown.map((q) => ({
            id: q.id,
            position: q.position,
            type: q.type,
            title: q.title,
            description: q.type === 'fill_blank' ? maskBlanks(q.description) : q.description,
            options: q.type === 'mcq' ? q.options.map(({ id, option_text }) => ({ id, option_text })) : [],
            selectedOptionId: q.selectedOptionId,
            blankAnswers: q.type === 'fill_blank' ? q.blankAnswers : [],
            answerText: q.type === 'open_ended' ? q.answerText : null,
            answerFiles: q.answerFiles.map(({ id, original_name, file_name, file_size }) => ({ id, original_name, file_name, file_size })),
            questionFiles: q.questionFiles.map(({ id, original_name, file_name, file_size }) => ({ id, original_name, file_name, file_size }))
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
