import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../../services/ProblemSetService';
import MultipleChoiceEditor from './MultipleChoiceEditor';
import FillBlankEditor from './FillBlankEditor';
import OpenEndedEditor from './OpenEndedEditor';
import IssueList from './IssueList';
import QuestionComments from './QuestionComments';
import { QUESTION_TYPES, getQuestionType } from './questionTypes';

//One question on the builder page. Edits go up through onChange and stay unsaved until Save as Draft / Publish;
//only deleting the question and attaching/removing files talk to the server straight away.
const QuestionCard = ({ classId, setId, question, value, questionNumber, showPoints, issues = [], onChange, onTypeChange, onFilesChange, onDeleted }) => {
    const [deleting, setDeleting] = useState(false);
    const { type, title, points, description, options, distractors, files } = value;
    const TypeIcon = getQuestionType(type).icon;

    const handleDelete = async () => {
        if (!window.confirm(`Delete Q${questionNumber}? This can't be undone.`)) return;

        setDeleting(true);
        try {
            await problemSetService.deleteQuestion(classId, setId, question.id);
            toast.success("Question deleted successfully.");
            onDeleted();

        } catch (error) {
            toast.error(error.error || "Failed to delete the question.");
            console.error(error);

        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
            issues.length ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}>
            <div className='flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100'>
                <span className='text-sm font-bold text-purple-600'>Q{questionNumber}</span>
                <input
                    value={title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    placeholder='Question title'
                    maxLength={255}
                    aria-label='Question title'
                    className='flex-1 min-w-48 text-base font-bold text-slate-900 bg-transparent rounded-md px-1.5 py-1 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-200'
                />
                {showPoints && (
                    <input
                        type='number'
                        min='0'
                        step='1'
                        value={points}
                        onChange={(e) => onChange({ points: e.target.value })}
                        placeholder='Number of Point'
                        aria-label='Number of points'
                        className='w-40 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                )}
                <div className='relative'>
                    <TypeIcon className='w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none' />
                    <select
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value)}
                        aria-label='Question type'
                        className='h-10 pl-9 pr-3 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    >
                        {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className='p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50'
                    aria-label='Delete question'
                >
                    <Trash2 className='w-4 h-4' />
                </button>
            </div>

            <IssueList issues={issues} className='mx-6 mt-4' />

            <div className='p-6'>
                {type === 'fill_blank' ? (
                    <FillBlankEditor
                        key={`${question.id}-fill`}
                        value={description}
                        onChange={(next) => onChange({ description: next })}
                        distractors={distractors}
                        onDistractorsChange={(next) => onChange({ distractors: next })}
                    />
                ) : type === 'open_ended' ? (
                    <OpenEndedEditor
                        key={`${question.id}-open`}
                        classId={classId}
                        setId={setId}
                        questionId={question.id}
                        description={description}
                        files={files}
                        onDescriptionChange={(next) => onChange({ description: next })}
                        onFilesChange={onFilesChange}
                    />
                ) : (
                    <MultipleChoiceEditor
                        key={`${question.id}-mcq`}
                        classId={classId}
                        setId={setId}
                        description={description}
                        options={options}
                        onChange={onChange}
                    />
                )}
            </div>

            <div className='px-6 pb-6'>
                <QuestionComments classId={classId} setId={setId} questionId={question.id} collapsible />
            </div>
        </div>
    );
};

export default QuestionCard;
