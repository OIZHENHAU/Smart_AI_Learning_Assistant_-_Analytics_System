import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ClipboardCheck, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import submissionService from '../../services/SubmissionService';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { formatPoints } from '../../utils/formatPoints';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];
const inputClass = 'w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400';

const StatusBadge = ({ row }) => {
    if (row.status === 'graded') {
        return <span className='px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700'>Graded</span>;
    }
    return row.draft_saved_at
        ? <span className='px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700'>In Progress</span>
        : <span className='px-2.5 py-1 rounded-full text-xs font-semibold bg-grey-100 text-grey-700'>Not Graded</span>;
};

const ClassSubmissionsPage = () => {
    const { classData } = useOutletContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    const canGrade = STAFF_ROLES.includes(user?.role);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assessment, setAssessment] = useState('');
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const hasFilters = assessment || name || startDate || endDate;

    //Runs on mount, then (debounced) whenever a filter changes.
    useEffect(() => {
        const timeout = setTimeout(async () => {
            try {
                const result = await submissionService.getSubmissions(classData.id, { assessment, name, startDate, endDate });
                setRows(Array.isArray(result?.data) ? result.data : []);

            } catch (error) {
                toast.error(error.error || "Failed to load the submissions.");
                console.error(error);

            } finally {
                setLoading(false);
            }
        }, 400);
        return () => clearTimeout(timeout);
    }, [classData.id, assessment, name, startDate, endDate]);

    const gradePath = (row) => `/classes/${classData.id}/submission/${row.id}`;
    const reviewPath = (row) => `/classes/${classData.id}/problem-sets/${row.problem_set_id}/attempt/result`;
    //A student sees the marked submission once graded, and their own answers ("Your Answers") before that.
    const studentPath = (row) => (row.status === 'graded' ? gradePath(row) : reviewPath(row));
    const primaryPath = (row) => (canGrade ? gradePath(row) : studentPath(row));

    return (
        <div>
            <div className='flex items-center gap-4 mb-8'>
                <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                    <ClipboardCheck className='w-7 h-7 text-purple-600' />
                </div>
                <div>
                    <h2 className='text-2xl font-bold text-slate-900'>Submission</h2>
                    <p className='text-sm text-slate-500'>
                        {canGrade ? 'Assignments submitted by students.' : 'The problem sets you have submitted.'}
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <div className='flex flex-wrap items-end gap-4 w-full mb-8'>
                <div className='flex-1 min-w-[220px] flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Assessment:</label>
                    <input type='text' value={assessment} onChange={(e) => setAssessment(e.target.value)} className={inputClass} />
                </div>
                {canGrade && (
                    <div className='flex-1 min-w-[220px] flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-slate-700'>Name:</label>
                        <input type='text' value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </div>
                )}
                <div className='flex-[1.4] min-w-[280px] flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-slate-700'>Created At:</label>
                    <div className='flex items-center gap-2'>
                        <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                        <span className='text-sm text-slate-500 shrink-0'>to</span>
                        <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className='flex justify-center items-center py-20'>
                    <Spinner />
                </div>
            ) : rows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-24 text-center'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <ClipboardCheck className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>
                        {hasFilters ? 'No matching submission' : 'No submissions yet'}
                    </h3>
                    <p className='text-slate-400 text-sm'>
                        {hasFilters
                            ? 'Try changing your search.'
                            : canGrade ? 'Submissions appear here once students submit a problem set.' : "You haven't submitted any problem set yet."}
                    </p>
                </div>
            ) : (
                <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto'>
                    <table className='w-full text-left'>
                        <thead>
                            <tr className='text-sm font-bold text-slate-900 border-b border-slate-200'>
                                <th className='pb-3 pr-4'>S/N</th>
                                {canGrade && <th className='pb-3 pr-4'>Name</th>}
                                <th className='pb-3 pr-4'>Assessment</th>
                                <th className='pb-3 pr-4'>Submitted At</th>
                                <th className='pb-3 pr-4'>Status</th>
                                <th className='pb-3 pr-4'>Grade</th>
                                <th className='pb-3 text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={row.id} className='border-b border-slate-100 last:border-0'>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{index + 1}</td>
                                    {canGrade && <td className='py-4 pr-4 text-sm text-slate-600'>{row.student_name}</td>}
                                    <td className='py-4 pr-4'>
                                        <button
                                            onClick={() => navigate(primaryPath(row))}
                                            className='text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline text-left'
                                        >
                                            {row.assessment}
                                        </button>
                                    </td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{moment(row.submitted_at).format('M/D/YYYY h:mm A')}</td>
                                    <td className='py-4 pr-4'><StatusBadge row={row} /></td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>
                                        {row.score != null ? `${formatPoints(row.score)} / ${formatPoints(row.total_points)}` : '—'}
                                    </td>
                                    <td className='py-4'>
                                        <div className='flex items-center justify-end gap-2'>
                                            {canGrade ? (
                                                row.status === 'graded' ? (
                                                    <button
                                                        onClick={() => navigate(gradePath(row))}
                                                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors'
                                                    >
                                                        <Eye className='w-3.5 h-3.5' />
                                                        View
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(gradePath(row))}
                                                        className='px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors'
                                                    >
                                                        Grade
                                                    </button>
                                                )
                                            ) : (
                                                <button
                                                    onClick={() => navigate(studentPath(row))}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors'
                                                >
                                                    <Eye className='w-3.5 h-3.5' />
                                                    View
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ClassSubmissionsPage;
