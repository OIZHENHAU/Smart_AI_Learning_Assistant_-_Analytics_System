import React from 'react';
import moment from 'moment';
import { formatPoints } from '../../../utils/formatPoints';

const Row = ({ label, children }) => (
    <tr className='border-b border-slate-100 last:border-0'>
        <td className='py-3 pr-4 text-sm font-semibold text-slate-900 w-44 align-top'>{label}</td>
        <td className='py-3 text-sm text-slate-600'>{children}</td>
    </tr>
);

const formatDate = (value) => (value ? moment(value).format('D MMM YYYY, h:mma') : '—');

//Statistics and Grade Summary under the last question. marks = the mark shown for each question (questionId -> value).
const GradingSummary = ({ attempt, questions, marks, score, total }) => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm'>
            <h3 className='text-lg font-bold text-slate-900 mb-3'>Statistics</h3>
            <table className='w-full text-left'>
                <tbody>
                    <Row label='Name'><span className='text-purple-600 font-medium'>{attempt.studentName}</span></Row>
                    <Row label='Submission Status'>{attempt.status === 'graded' ? 'Graded' : 'Not Graded'}</Row>
                    <Row label='Total Grade'>{formatPoints(score)} / {formatPoints(total)}</Row>
                    <Row label='Submitted At'>{formatDate(attempt.submittedAt)}</Row>
                    <Row label='Grader'>
                        {attempt.graderName ? <span className='text-purple-600 font-medium'>{attempt.graderName}</span> : '—'}
                    </Row>
                    <Row label='Graded At'>{formatDate(attempt.gradedAt)}</Row>
                </tbody>
            </table>
        </div>

        <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm'>
            <h3 className='text-lg font-bold text-slate-900 mb-3'>Grade Summary</h3>
            <table className='w-full text-left'>
                <thead>
                    <tr className='text-sm font-bold text-slate-900 border-b border-slate-200'>
                        <th className='pb-3 pr-4'>Question</th>
                        <th className='pb-3 text-right whitespace-nowrap'>Total Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {questions.map((q, index) => {
                        const mark = marks[q.id];
                        const hasMark = mark !== '' && mark != null && Number.isFinite(Number(mark));
                        return (
                            <tr key={q.id} className='border-b border-slate-100 last:border-0'>
                                <td className='py-3 pr-4 text-sm font-medium text-slate-700'>Question {index + 1}: {q.title}</td>
                                <td className='py-3 text-sm text-slate-600 text-right whitespace-nowrap'>
                                    {hasMark ? formatPoints(mark) : '—'} / {q.points}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);

export default GradingSummary;
