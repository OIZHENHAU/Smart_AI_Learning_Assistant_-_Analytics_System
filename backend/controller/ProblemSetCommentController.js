import sanitizeHTML from 'sanitize-html';
import ProblemSet from '../models/ProblemSet.js';
import ProblemSetComment from '../models/ProblemSetComment.js';
import { getClassAccess, sendError, COMMENT_CLEAN_OPTIONS } from '../utils/ClassAccess.js';

//Same text without any tags, so an empty <p></p> does not count as a comment.
const toPlainText = (html) =>
    sanitizeHTML(html.replace(/<\/(p|li|h[1-3]|blockquote)>/gi, ' '), { allowedTags: [], allowedAttributes: {} }).trim();

//Checks the caller can open the class, the set belongs to it (and is published, unless the caller is staff),
//and the question belongs to that set.
const loadQuestion = async (req) => {
    const access = await getClassAccess(req.params.id, req.user);
    if (access.error) return access;

    const set = await ProblemSet.getById(req.params.setId);
    if (!set || set.class_id !== access.classroom.id) return { status: 404, error: "Problem set not found." };
    if (set.status !== 'published' && !access.canManage) {
        return { status: 403, error: "This problem set is not published yet." };
    }

    const question = await ProblemSet.getQuestionById(req.params.questionId);
    if (!question || question.problem_set_id !== set.id) return { status: 404, error: "Question not found." };

    return { ...access, set, question };
};

//Same check as loadQuestion, plus the comment must be on that question AND in a conversation the caller may see:
//staff see every conversation, a student only their own. Anything else is a plain 404, so a student can't even
//tell whether another student's comment exists.
const loadComment = async (req) => {
    const result = await loadQuestion(req);
    if (result.error) return result;

    const comment = await ProblemSetComment.getById(req.params.commentId);
    if (!comment || comment.question_id !== result.question.id) return { status: 404, error: "Comment not found." };

    const thread = comment.parent_id === null ? comment : await ProblemSetComment.getById(comment.parent_id);
    if (!result.canManage && thread?.author_id !== req.user.id) return { status: 404, error: "Comment not found." };

    return { ...result, comment, thread };
};

//Cleans a comment, returns { content } or { error }.
const readContent = (body) => {
    const content = sanitizeHTML(body.content || '', COMMENT_CLEAN_OPTIONS);
    if (!toPlainText(content)) return { error: "Please write your comment." };
    if (content.length > 20000) return { error: "Your comment is too long." };
    return { content };
};

//Staff get every student's conversation; a student only gets their own.
//GET /api/classes/:id/problem-sets/:setId/questions/:questionId/comments
export const getQuestionComments = async (req, res, next) => {
    try {
        const result = await loadQuestion(req);
        if (result.error) return sendError(res, result.status, result.error);

        const data = await ProblemSetComment.getConversations(result.question.id, result.canManage ? null : req.user.id);

        res.status(200).json({ success: true, message: "Comments retrieved successfully.", data, statusCode: 200 });

    } catch (error) {
        console.error("Fail to get the question comments at the controller due to: " + error);
        next(error);
    }
};

//A student's message always goes into their own conversation (it's started by their first message);
//staff can only reply inside a student's conversation.
//POST /api/classes/:id/problem-sets/:setId/questions/:questionId/comments  body: { content, parentId? }
export const createQuestionComment = async (req, res, next) => {
    try {
        const result = await loadQuestion(req);
        if (result.error) return sendError(res, result.status, result.error);

        const body = readContent(req.body);
        if (body.error) return sendError(res, 400, body.error);

        let parentId = req.body.parentId ? Number(req.body.parentId) : null;

        if (parentId === null) {
            if (result.canManage) return sendError(res, 400, "Reply inside a student's conversation to answer them.");
            //One conversation per student per question, so a later message joins the existing one.
            const existing = await ProblemSetComment.getThreadByStudent(result.question.id, req.user.id);
            if (existing) parentId = existing.id;

        } else {
            //Must be a conversation on this question that the caller may see: any when staff, a student's own otherwise.
            const parent = Number.isInteger(parentId) ? await ProblemSetComment.getById(parentId) : null;
            if (!parent || parent.question_id !== result.question.id || parent.parent_id !== null
                || (!result.canManage && parent.author_id !== req.user.id)) {
                return sendError(res, 404, "Comment not found.");
            }
        }

        const id = await ProblemSetComment.create({
            questionId: result.question.id, parentId, authorId: req.user.id, content: body.content
        });

        res.status(201).json({ success: true, message: "Message sent successfully.", data: { id }, statusCode: 201 });

    } catch (error) {
        console.error("Fail to post the question comment at the controller due to: " + error);
        next(error);
    }
};

//Edit a comment (its author only): PUT .../questions/:questionId/comments/:commentId
export const updateQuestionComment = async (req, res, next) => {
    try {
        const result = await loadComment(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (result.comment.author_id !== req.user.id) return sendError(res, 403, "You can only edit your own comment.");

        const body = readContent(req.body);
        if (body.error) return sendError(res, 400, body.error);

        await ProblemSetComment.update(result.comment.id, body.content);

        res.status(200).json({ success: true, message: "Comment updated successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to update the question comment at the controller due to: " + error);
        next(error);
    }
};

//Its author, or staff, may delete (loadComment already blocks other students' conversations).
//Deleting a conversation's first message deletes the whole conversation.
//DELETE .../questions/:questionId/comments/:commentId
export const deleteQuestionComment = async (req, res, next) => {
    try {
        const result = await loadComment(req);
        if (result.error) return sendError(res, result.status, result.error);
        if (result.comment.author_id !== req.user.id && !result.canManage) {
            return sendError(res, 403, "You cannot delete this comment.");
        }

        await ProblemSetComment.remove(result.comment.id);

        res.status(200).json({ success: true, message: "Comment deleted successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to delete the question comment at the controller due to: " + error);
        next(error);
    }
};
