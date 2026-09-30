import React from 'react';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import BlankPassage from '../ProblemSet/BlankPassage';
import AttachmentList from '../ProblemSet/AttachmentList';
import { CommentEntry } from '../Document/CommentThread';
import { hasDescription } from '../ProblemSet/publishChecks';
import QuestionComments from '../ProblemSet/QuestionComments';
import { formatPoints } from '../../../utils/formatPoints';

const Badge = ({ color, children }) => (
    <span className={`shrink-0 px-3 py-1 rounded-md text-xs font-semibold text-white ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}>
        {children}
    </span>
);

//answerLabel: "Student's Answer" for the lecturer, "Your Answer" for the student.
const MultipleChoice = ({ q, answerLabel }) => (
    <div className='space-y-3 mt-5'>
        {q.options.map((opt) => {
            const picked = q.selectedOptionId === opt.id;
            const tone = opt.isCorrect ? 'green' : picked ? 'red' : null;
            return (
                <div
                    key={opt.id}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 ${
                        tone === 'green' ? 'border-green-400 bg-green-50 text-green-800'
                            : tone === 'red' ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-slate-200 text-slate-600'}`}
                >
                    <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        tone === 'green' ? 'border-green-500 bg-green-500' : tone === 'red' ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>
                        {tone && <span className='w-2 h-2 rounded-full bg-white' />}
                    </span>
                    <span className='flex-1 text-sm'>{opt.text}</span>
                    {opt.isCorrect && <Badge color='green'>Correct Answer</Badge>}
                    {picked && <Badge color={opt.isCorrect ? 'green' : 'red'}>{answerLabel}</Badge>}
                </div>
            );
        })}
        {q.selectedOptionId == null && <p className='text-sm text-slate-400 italic'>The student didn't answer this question.</p>}
    </div>
);

const Chip = ({ tone, children }) => {
    const Icon = tone === 'green' ? CheckCircle2 : XCircle;
    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm ${
            tone === 'green' ? 'border-green-400 text-green-700' : 'border-red-400 text-red-600'}`}>
            <Icon className='w-5 h-5 shrink-0' /> {children}
        </div>
    );
};

const FillBlank = ({ q }) => (
    <div className='mt-2'>
        <BlankPassage
            html={q.description}
            className='text-lg text-slate-800 leading-[2.75]'
            renderBlank={(index) => {
                const blank = q.blanks[index];
                return (
                    <span className={`inline-block min-w-16 mx-1 px-4 rounded-lg text-center font-semibold text-white ${
                        blank?.correct ? 'bg-green-500' : 'bg-red-500'}`}>
                        {blank?.given || '—'}
                    </span>
                );
            }}
        />
        <div className='mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3'>
            {q.blanks.flatMap((blank, index) => blank.correct
                ? [<Chip key={`${index}-ok`} tone='green'>({index + 1}) {blank.answer}</Chip>]
                : [
                    <Chip key={`${index}-ans`} tone='green'>({index + 1}) {blank.answer}</Chip>,
                    <Chip key={`${index}-given`} tone='red'>({index + 1}) {blank.given || '(empty)'}</Chip>
                ])}
            {q.unusedWords.map((word) => (
                <div key={word} className='px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-300 text-center line-through'>
                    {word}
                </div>
            ))}
        </div>
        <p className='text-xs text-slate-400 mt-3'>{q.correctCount} of {q.blanks.length} blanks correct.</p>
    </div>
);

const OpenEnded = ({ q, answerLabel, readOnly }) => (
    <div className='space-y-4 mt-4'>
        <AttachmentList files={q.questionFiles} folder='problem-set-files' />
        <div>
            <p className='text-sm font-semibold text-slate-900 mb-2'>{answerLabel}:</p>
            {hasDescription(q.answerText) ? (
                <div className='rich-content text-sm text-slate-700 border border-slate-200 rounded-xl px-5 py-4' dangerouslySetInnerHTML={{ __html: q.answerText }} />
            ) : (
                <p className='text-sm text-slate-400 italic'>The student didn't write an answer.</p>
            )}
        </div>
        {q.answerFiles.length > 0 && (
            <div>
                <p className='text-sm font-semibold text-slate-900 mb-2'>{readOnly ? 'Your Upload:' : 'Student Upload:'}</p>
                <AttachmentList files={q.answerFiles} folder='problem-set-answers' />
            </div>
        )}
    </div>
);


const ResultIcon = ({ q }) => {
    if (q.type === 'open_ended') return null;
    const full = q.type === 'mcq' ? q.isCorrect : q.blanks.length > 0 && q.correctCount === q.blanks.length;
    const none = q.type === 'mcq' ? !q.isCorrect : q.correctCount === 0;
    const [Icon, style] = full ? [CheckCircle2, 'bg-green-500'] : none ? [XCircle, 'bg-red-500'] : [MinusCircle, 'bg-amber-500'];
    return (
        <span className={`w-11 h-11 rounded-xl ${style} text-white flex items-center justify-center shrink-0`}>
            <Icon className='w-6 h-6' />
        </span>
    );
};

//readOnly = the student viewing their own graded submission: the mark is shown instead of edited, and the
//comments are their own private conversation with the lecturer (where they can reply).
const GradeQuestionCard = ({ classId, setId, q, number, mark, invalid, comment, readOnly = false, onMarkChange, onCommentChange }) => {
    const answerLabel = readOnly ? 'Your Answer' : "Student's Answer";

    return (
    <div className='space-y-4'>
        <div className='bg-white border-2 border-slate-200 rounded-2xl p-6'>
            <div className='flex items-start justify-between gap-4 mb-4'>
                <span className='inline-block px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold'>Question {number}</span>
                <ResultIcon q={q} />
            </div>

            {q.type !== 'fill_blank' && (hasDescription(q.description) ? (
                <div className='rich-content text-base font-semibold text-slate-900' dangerouslySetInnerHTML={{ __html: q.description }} />
            ) : (
                <p className='text-base font-semibold text-slate-900'>{q.title}</p>
            ))}

            {q.type === 'fill_blank' ? <FillBlank q={q} />
                : q.type === 'open_ended' ? <OpenEnded q={q} answerLabel={answerLabel} readOnly={readOnly} />
                : <MultipleChoice q={q} answerLabel={answerLabel} />}
        </div>

        {readOnly ? (
            <div className='flex items-center gap-3'>
                <span className='text-sm text-slate-700'>Number of XP:</span>
                <span className='bg-white border border-slate-200 rounded-lg px-4 h-10 flex items-center text-sm text-slate-800'>
                    {mark === '' || mark == null ? '—' : formatPoints(mark)} / {q.points}
                </span>
            </div>
        ) : (
        <div className='flex flex-wrap items-center gap-3'>
            <label htmlFor={`mark-${q.id}`} className='text-sm text-slate-700'>Number of XP:</label>
            <div className={`flex items-center gap-1 bg-white border rounded-lg px-3 h-10 ${invalid ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'}`}>
                <input
                    id={`mark-${q.id}`}
                    type='number'
                    min='0'
                    max={q.points}
                    step='0.01'
                    value={mark}
                    disabled={q.points === 0}
                    onChange={(e) => onMarkChange(e.target.value)}
                    className='w-20 text-right text-sm bg-transparent focus:outline-none disabled:text-slate-400'
                />
                <span className='text-sm text-slate-500'>/{q.points}</span>
            </div>
            {q.points === 0 && <span className='text-xs text-slate-400'>This question has no points.</span>}
            {invalid && <span className='text-xs text-red-500'>Enter a mark between 0 and {q.points}.</span>}
        </div>
        )}

        {readOnly ? (
            <QuestionComments classId={classId} setId={setId} questionId={q.id} collapsible />
        ) : (
        <div className='bg-white border border-slate-200 rounded-2xl p-5 space-y-3'>
            <h4 className='text-base font-semibold text-slate-900'>Comments</h4>
            {q.messages.map((item) => (
                <CommentEntry key={item.id} item={item} currentUserId={null} canModerate={false} onEdit={() => {}} onDelete={() => {}} />
            ))}
            <RichTextEditor classId={classId} allowImages={false} value={comment} onChange={onCommentChange} />
        </div>
        )}
    </div>
    );
};

export default GradeQuestionCard;
