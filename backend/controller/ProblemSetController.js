import sanitizeHtml from 'sanitize-html';
import ProblemSet from '../models/ProblemSet.js';
import ProblemSetAttempt from '../models/ProblemSetAttempt.js';
import { removeBadgeFile } from '../config/problemSetBadgeUpload.js';
import { removeQuestionFile, removeQuestionFiles } from '../config/problemSetFileUpload.js';
import { removeAnswerFiles } from '../config/problemSetAnswerUpload.js';
import { extractImageFilenames, deleteUnusedImages } from '../utils/ProblemSetImages.js';
import { getBlanks, maskBlanks } from '../utils/ProblemSetBlanks.js';
import { getClassAccess, sendError } from '../utils/ClassAccess.js';

const QUESTION_TYPES = ['mcq', 'fill_blank', 'open_ended'];
//Most extra wrong words a fill-in-the-blank's word bank may have.
const MAX_DISTRACTORS = 20;

//Same tags a question description is allowed to have as an announcement's content, images included.
//data-blank marks a fill-in-the-blank answer inside the passage.
const DESCRIPTION_CLEAN_OPTIONS = {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a', 'img', 'span', 'h1', 'h2', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'], span: ['style', 'data-blank'] },
    allowedStyles: { span: { 'font-family': [/^[\w\s,'"-]+$/] } },
    allowedSchemes: ['http', 'https'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) }
};

//Same text without any tags, so an empty "<p></p>" doesn't count as a real description.
const toPlainText = (html) =>
    sanitizeHtml(html.replace(/<\/(p|li|h[1-3]|blockquote)>/gi, ' '), { allowedTags: [], allowedAttributes: {} }).trim();

//Loads the set and checks it belongs to this class; staff always see it, students only when published.
const loadSet = async (req) => {
    const access = await getClassAccess(req.params.id, req.user);
    if (access.error) return access;

    const set = await ProblemSet.getById(req.params.setId);
    if (!set || set.class_id !== access.classroom.id) return { status: 404, error: "Problem set not found." };
    if (set.status !== 'published' && !access.canManage) {
        return { status: 403, error: "This problem set is not published yet." };
    }

    return { ...access, set };
};

//Get the class's problem sets: GET /api/classes/:id/problem-sets
export const getProblemSets = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        const { title, startDate, endDate } = req.query;
        const data = await ProblemSet.getAllForClass(access.classroom.id, { includeDrafts: access.canManage, title, startDate, endDate });

        //Students see that they've submitted a set, never their score: results aren't released to them yet.
        let withAttempts = data;
        if (req.user.role === 'student') {
            const attempts = await ProblemSetAttempt.getAttemptsForUserByClass(access.classroom.id, req.user.id);
            withAttempts = data.map((set) => {
                const attempt = attempts.find((a) => a.problem_set_id === set.id);
                return { ...set, my_attempt: attempt ? { submitted_at: attempt.submitted_at } : null };
            });
        }

        res.status(200).json({
            success: true,
            message: "Problem sets retrieved successfully.",
            data: withAttempts,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the problem sets at the controller due to: " + error);
        next(error);
    }
};

//Create a draft immediately, so "Create Problem Set" can navigate straight into the builder: POST /api/classes/:id/problem-sets
export const createProblemSet = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);
        if (!access.canManage) return sendError(res, 403, "Only lecturer, parents or admin can create problem sets.");

        const title = (req.body.title || '').trim() || 'Untitled Problem Set';
        if (title.length > 255) return sendError(res, 400, "Title must be at most 255 characters.");

        const id = await ProblemSet.createDraft({ classId: access.classroom.id, authorId: req.user.id, title });

        res.status(201).json({
            success: true,
            message: "Problem set created successfully.",
            data: { id },
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to create the problem set at the controller due to: " + error);
        next(error);
    }
};

//Get one problem set with its questions/options and achievement: GET /api/classes/:id/problem-sets/:setId
export const getProblemSetDetail = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);

        const [rawQuestions, achievement] = await Promise.all([
            ProblemSet.getQuestions(result.set.id),
            ProblemSet.getAchievement(result.set.id)
        ]);
        const totalPoints = rawQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

        //Only the lecturer/parents/admin who can manage this set get to see the answers. A student (or anyone else
        //who isn't staff) never receives is_correct, nor a fill-in-the-blank's answers (they live both in the
        //passage and in the options), at the API level, not just the UI.
        const questions = result.canManage
            ? rawQuestions
            : rawQuestions.map((q) => q.type === 'fill_blank'
                ? { ...q, description: maskBlanks(q.description), options: q.options.map(({ id, position }) => ({ id, position })) }
                : { ...q, options: q.options.map(({ is_correct, ...option }) => option) });

        res.status(200).json({
            success: true,
            message: "Problem set retrieved successfully.",
            data: { ...result.set, questions, achievement: achievement || null, totalPoints },
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the problem set at the controller due to: " + error);
        next(error);
    }
};

//Rename a problem set: PUT /api/classes/:id/problem-sets/:setId
export const updateProblemSetTitle = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot edit this problem set.");

        const title = (req.body.title || '').trim();
        if (!title || title.length > 255) return sendError(res, 400, "Title is required and must be at most 255 characters.");

        await ProblemSet.updateTitle(result.set.id, title);

        res.status(200).json({ success: true, message: "Title updated successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to update the problem set title at the controller due to: " + error);
        next(error);
    }
};

//Delete a problem set: DELETE /api/classes/:id/problem-sets/:setId
export const deleteProblemSet = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot delete this problem set.");

        const achievement = await ProblemSet.getAchievement(result.set.id);
        const questionFiles = await ProblemSet.getFileNamesBySet(result.set.id);
        const answerFiles = await ProblemSetAttempt.getFileNamesBySet(result.set.id);
        await ProblemSet.deleteSet(result.set.id); //questions/options/files/attempts/achievement cascade
        if (achievement) await removeBadgeFile(achievement.badge_image);
        await removeQuestionFiles(questionFiles);
        await removeAnswerFiles(answerFiles);

        res.status(200).json({ success: true, message: "Problem set deleted successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to delete the problem set at the controller due to: " + error);
        next(error);
    }
};

//Add a blank question of the given type (multiple choice by default): POST /api/classes/:id/problem-sets/:setId/questions
//body: { type: 'mcq' | 'fill_blank' | 'open_ended' }
export const addQuestion = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot edit this problem set.");

        const type = QUESTION_TYPES.includes(req.body?.type) ? req.body.type : 'mcq';
        const id = await ProblemSet.addQuestion(result.set.id, type);

        res.status(201).json({ success: true, message: "Question added successfully.", data: { id }, statusCode: 201 });

    } catch (error) {
        console.error("Fail to add the question at the controller due to: " + error);
        next(error);
    }
};

//Only checks that the request itself is well-formed (lengths, and points being a real number). Business rules
//like "a title is required" or "a description needs more than one option" are intentionally NOT enforced here:
//a draft is allowed to be incomplete. Those rules are only enforced once, together, when the set is published.
const readQuestionBody = (body) => {
    const type = QUESTION_TYPES.includes(body.type) ? body.type : 'mcq';
    const title = (body.title || '').trim();
    const description = sanitizeHtml(body.description || '', DESCRIPTION_CLEAN_OPTIONS);
    const points = body.points === '' || body.points === undefined || body.points === null ? null : Number(body.points);

    //A fill-in-the-blank's answers are always read back out of the passage itself, never taken from the client.
    let options = [];
    if (type === 'mcq' && Array.isArray(body.options)) {
        //id is the option's existing row (none for a newly added option), so saving can update it in place.
        options = body.options
            .map((o) => ({
                id: Number.isInteger(Number(o.id)) && o.id != null ? Number(o.id) : null,
                text: (o.text || '').trim(),
                isCorrect: !!o.isCorrect
            }))
            .filter((o) => o.text);
    } else if (type === 'fill_blank') {
        //The blanks (correct, in reading order) come first, then the extra wrong words for the word bank.
        //An extra word that repeats a blank answer or another extra word is dropped, ignoring case.
        const blanks = getBlanks(description);
        const seen = new Set(blanks.map((text) => text.toLowerCase()));
        const distractors = [];
        for (const raw of Array.isArray(body.distractors) ? body.distractors : []) {
            const text = String(raw ?? '').trim();
            if (!text || seen.has(text.toLowerCase()) || distractors.length >= MAX_DISTRACTORS) continue;
            seen.add(text.toLowerCase());
            distractors.push(text);
        }
        options = [
            ...blanks.map((text) => ({ text, isCorrect: true })),
            ...distractors.map((text) => ({ text, isCorrect: false }))
        ];
    }

    if (title.length > 255) return { error: "Question title must be at most 255 characters." };
    if (points !== null && (!Number.isInteger(points) || points < 0)) return { error: "Points must be a whole number." };
    if (options.some((o) => o.text.length > 500)) return { error: "Each answer must be at most 500 characters." };

    return { type, title, description, points, options };
};

//Save a question's fields and its answer options: PUT /api/classes/:id/problem-sets/:setId/questions/:questionId
export const updateQuestion = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot edit this problem set.");

        const question = await ProblemSet.getQuestionById(req.params.questionId);
        if (!question || question.problem_set_id !== result.set.id) return sendError(res, 404, "Question not found.");

        const body = readQuestionBody(req.body);
        if (body.error) return sendError(res, 400, body.error);

        await ProblemSet.updateQuestion(question.id, body);

        //Only an open-ended question keeps attachments; switching it to another type drops them.
        if (body.type !== 'open_ended') {
            await removeQuestionFiles(await ProblemSet.deleteFilesForQuestion(question.id));
        }

        //Images that were in the old description but not in the new one are no longer needed.
        const stillUsed = extractImageFilenames(body.description);
        const removed = extractImageFilenames(question.description).filter((filename) => !stillUsed.includes(filename));
        await deleteUnusedImages(removed, question.id);

        res.status(200).json({ success: true, message: "Question saved successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to update the question at the controller due to: " + error);
        next(error);
    }
};

//Delete a question: DELETE /api/classes/:id/problem-sets/:setId/questions/:questionId
export const deleteQuestion = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot edit this problem set.");

        const question = await ProblemSet.getQuestionById(req.params.questionId);
        if (!question || question.problem_set_id !== result.set.id) return sendError(res, 404, "Question not found.");

        const questionFiles = await ProblemSet.getFileNamesByQuestion(question.id);
        const answerFiles = await ProblemSetAttempt.getFileNamesByQuestion(question.id);
        await ProblemSet.deleteQuestion(result.set.id, question.id); //options, files and answers cascade
        await deleteUnusedImages(extractImageFilenames(question.description), question.id);
        await removeQuestionFiles(questionFiles);
        await removeAnswerFiles(answerFiles);

        res.status(200).json({ success: true, message: "Question deleted successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to delete the question at the controller due to: " + error);
        next(error);
    }
};

//Create the blank achievement row the moment the toggle is switched on, so there is something in the database
//to autosave into right away (and so it survives a refresh even before any field has been filled in).
//POST /api/classes/:id/problem-sets/:setId/achievement
export const createAchievementDraft = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot edit this problem set.");

        await ProblemSet.createDraftAchievement(result.set.id);
        const achievement = await ProblemSet.getAchievement(result.set.id);

        res.status(201).json({ success: true, message: "Achievement started.", data: achievement, statusCode: 201 });

    } catch (error) {
        console.error("Fail to start the achievement at the controller due to: " + error);
        next(error);
    }
};

//Autosaves whatever fields were given (multipart: the badge image is optional, keeping the existing one when
//absent). Nothing here requires the achievement to be complete yet: that is only checked once, at publish.
//PUT /api/classes/:id/problem-sets/:setId/achievement
export const saveAchievement = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) {
            if (req.file) await removeBadgeFile(req.file.filename);
            return sendError(res, result.status, result.error);
        }
        if (!result.canManage) {
            if (req.file) await removeBadgeFile(req.file.filename);
            return sendError(res, 403, "You cannot edit this problem set.");
        }

        const title = (req.body.title || '').trim();
        if (title.length > 150) {
            if (req.file) await removeBadgeFile(req.file.filename);
            return sendError(res, 400, "Title must be at most 150 characters.");
        }
        const description = (req.body.description || '').trim();
        const minPoints = req.body.minPoints === '' || req.body.minPoints === undefined || req.body.minPoints === null
            ? null : Number(req.body.minPoints);
        if (minPoints !== null && (!Number.isInteger(minPoints) || minPoints < 0)) {
            if (req.file) await removeBadgeFile(req.file.filename);
            return sendError(res, 400, "Minimum points must be a whole number.");
        }
        const expiryDate = (req.body.expiryDate || '').trim();

        const existing = await ProblemSet.getAchievement(result.set.id);
        const badgeImage = req.file ? req.file.filename : existing?.badge_image;

        await ProblemSet.upsertAchievement(result.set.id, {
            badgeImage: badgeImage || null,
            title: title || null,
            description: description || null,
            minPoints,
            expiryDate: expiryDate || null
        });
        if (req.file && existing?.badge_image && existing.badge_image !== badgeImage) {
            await removeBadgeFile(existing.badge_image);
        }

        res.status(200).json({ success: true, message: "Achievement saved successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to save the achievement at the controller due to: " + error);
        next(error);
    }
};

//Remove the achievement: DELETE /api/classes/:id/problem-sets/:setId/achievement
export const removeAchievement = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot edit this problem set.");

        const badgeImage = await ProblemSet.deleteAchievement(result.set.id);
        if (badgeImage) await removeBadgeFile(badgeImage);

        res.status(200).json({ success: true, message: "Achievement removed successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to remove the achievement at the controller due to: " + error);
        next(error);
    }
};

//Publish: re-checks everything server-side, never trusts the builder's own client-side validation alone.
//PUT /api/classes/:id/problem-sets/:setId/publish
export const publishProblemSet = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot publish this problem set.");
        if (result.set.status === 'published') return sendError(res, 409, "This problem set is already published.");

        const [questions, achievement] = await Promise.all([
            ProblemSet.getQuestions(result.set.id),
            ProblemSet.getAchievement(result.set.id)
        ]);

        if (questions.length === 0) return sendError(res, 400, "Add at least one question before publishing.");

        //Collects every problem across every question, rather than stopping at the first one, so the builder
        //can show the lecturer everything that needs fixing in one pass instead of a fix-one-republish loop.
        const issues = [];
        //scope says where the builder shows the issue: on a question card, or on the achievement card.
        const addIssue = (q, message) => issues.push({
            scope: q ? 'question' : 'achievement',
            questionId: q?.id ?? null,
            questionNumber: q ? questions.indexOf(q) + 1 : null,
            questionTitle: q?.title?.trim() || (q ? 'Untitled Question' : null),
            message
        });

        for (const q of questions) {
            if (!q.title.trim()) addIssue(q, "This question needs a title.");
            if (achievement && q.points == null) {
                addIssue(q, "This question needs a points value because the set has an achievement.");
            }
            const hasDescription = !!toPlainText(q.description || '') || (q.description || '').includes('<img');

            if (q.type === 'fill_blank') {
                const blanks = q.options.filter((o) => o.is_correct);
                if (blanks.length === 0) {
                    addIssue(q, "Highlight at least one word or phrase in the passage and turn it into a blank.");
                } else if (blanks.some((o) => !o.option_text.trim())) {
                    addIssue(q, "Every blank needs some text in it.");
                }
            } else if (q.type === 'open_ended') {
                if (!hasDescription && q.files.length === 0) {
                    addIssue(q, "Add a description or attach a file so students know what to answer.");
                }
            } else {
                if (hasDescription && q.options.length <= 1) {
                    addIssue(q, "This question has a description, so it needs more than one answer option.");
                }
                if (q.options.length > 0 && !q.options.some((o) => o.is_correct)) {
                    addIssue(q, "This question needs one answer option marked correct.");
                }
            }
        }

        //The achievement row exists as soon as the toggle is switched on, and is filled in gradually from
        //there, so every field is checked here rather than when each one is saved.
        if (achievement) {
            if (!achievement.badge_image) addIssue(null, "The achievement needs a badge image.");
            if (!achievement.title) addIssue(null, "The achievement needs a title.");
            if (!achievement.description) addIssue(null, "The achievement needs a description.");
            if (achievement.min_points == null) addIssue(null, "The achievement needs a minimum points value.");
            if (!achievement.expiry_date) addIssue(null, "The achievement needs an expiry date.");

            const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
            if (achievement.min_points != null && achievement.min_points > totalPoints) {
                addIssue(null, `The achievement's minimum (${achievement.min_points}) is higher than the set's total points (${totalPoints}).`);
            }
        }

        if (issues.length > 0) {
            return res.status(400).json({
                success: false,
                error: "This problem set is not ready to publish yet.",
                data: { issues },
                statusCode: 400
            });
        }

        await ProblemSet.publish(result.set.id);

        res.status(200).json({ success: true, message: "Problem set published successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to publish the problem set at the controller due to: " + error);
        next(error);
    }
};

//Upload an image for a question's description editor: POST /api/classes/:id/problem-sets/:setId/images (form field "image")
//Class access is already checked by requireClassManager before multer runs.
export const uploadQuestionImage = async (req, res, next) => {
    try {
        if (!req.file) return sendError(res, 400, "Please choose an image.");

        const url = `http://localhost:${process.env.PORT || 5528}/uploads/problem-set-descriptions/${req.file.filename}`;

        res.status(201).json({ success: true, data: { url }, statusCode: 201 });

    } catch (error) {
        console.error("Fail to upload the problem set image at the controller due to: " + error);
        next(error);
    }
};

//Attach a file to an open-ended question: POST /api/classes/:id/problem-sets/:setId/questions/:questionId/files (form field "file")
//Uploads straight away (like description images), so the file is on the question even before Save as Draft.
export const uploadQuestionFile = async (req, res, next) => {
    try {
        if (!req.file) return sendError(res, 400, "Please choose a file.");

        const result = await loadSet(req);
        if (result.error || !result.canManage) {
            await removeQuestionFile(req.file.filename);
            return sendError(res, result.status || 403, result.error || "You cannot edit this problem set.");
        }

        const question = await ProblemSet.getQuestionById(req.params.questionId);
        if (!question || question.problem_set_id !== result.set.id) {
            await removeQuestionFile(req.file.filename);
            return sendError(res, 404, "Question not found.");
        }

        const file = await ProblemSet.addQuestionFile(question.id, {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            fileSize: req.file.size
        });

        res.status(201).json({ success: true, message: "File attached successfully.", data: file, statusCode: 201 });

    } catch (error) {
        if (req.file) await removeQuestionFile(req.file.filename);
        console.error("Fail to upload the question file at the controller due to: " + error);
        next(error);
    }
};

//Remove an attached file: DELETE /api/classes/:id/problem-sets/:setId/questions/:questionId/files/:fileId
export const deleteQuestionFile = async (req, res, next) => {
    try {
        const result = await loadSet(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (!result.canManage) return sendError(res, 403, "You cannot edit this problem set.");

        const question = await ProblemSet.getQuestionById(req.params.questionId);
        if (!question || question.problem_set_id !== result.set.id) return sendError(res, 404, "Question not found.");

        const file = await ProblemSet.getQuestionFile(req.params.fileId);
        if (!file || file.question_id !== question.id) return sendError(res, 404, "File not found.");

        await ProblemSet.deleteQuestionFile(file.id);
        await removeQuestionFile(file.file_name);

        res.status(200).json({ success: true, message: "File removed successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to delete the question file at the controller due to: " + error);
        next(error);
    }
};
