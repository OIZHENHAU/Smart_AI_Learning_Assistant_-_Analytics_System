import React from 'react';
import {Link} from 'react-router-dom';
import {Play, BarChart2, Trash2, Award} from 'lucide-react';
import moment from 'moment';

const QuizCard = ({quiz, onDelete}) => {
    return (
        <div className='group relative bg-white/80 backdrop-blur-xl border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between'>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(quiz);
                }}
                className='absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200'
            >
                <Trash2 className='w-4 h-4' strokeWidth={2} />
            </button>

            <div className='space-y-4'>
                {/* Status Badge */}
                <div className='inline-flex items-center gap-1.5 py-1 rounded-lg text-xs font-semibold'>
                    <div className='flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1'>
                        <Award className='w-4 h-4 text-purple-600' strokeWidth={3}/>
                        <span className='text-purple-700'>Score: {quiz?.score}</span>
                    </div>
                </div>

                <div>
                    <h3
                        className='text-base font-semibold text-slate-900 mb-1 line-clamp-2'
                        title={quiz.title}
                    >
                        {quiz.title || `Quiz - ${moment(quiz.createdAt).format("MMM D, YYYY")}`}
                    </h3>
                    <p className='text-xs font-medium text-slate-500 uppercase tracking-wide'>
                        Created {moment(quiz.createdAt).format("MMM D, YYYY")}
                    </p>
                </div>

                {/* Quiz Info */}
                <div className='flex items-center gap-3 pt-2 border-t border-slate-100'>
                    <div className='px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg'>
                        <span className='text-sm font-semibold text-slate-700'>
                            {quiz.questions.length}{" "}
                            {quiz.questions.length === 1 ? "Question" : "Questions"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className='mt-2 pt-4 border-t border-slate-100'>
                {quiz?.completed_at ? (
                    <Link to={`/quizzes/${quiz.id}/results`}>
                        <button className='group/btn relative w-full h-11 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 active:scale-95 overflow-hidden'>
                            View Results
                        </button>
                    </Link>
                    ) : (
                    <Link to={`/quizzes/${quiz.id}`}>
                        <button className='group/btn relative w-full h-11 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 active:scale-95 overflow-hidden'>
                            <span className='relative z-10 flex items-center justify-center gap-2'>
                                Start Attempt
                            </span>
                            <div className='absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700'/>
                        </button>
                    </Link>
                )}
            </div>
        </div>
    );
}

export default QuizCard;