import React from 'react';
import { AlertCircle } from 'lucide-react';

//The red "what still needs fixing" box shown inside a card after a publish attempt found problems.
const IssueList = ({ issues, className = '' }) => {
    if (!issues.length) return null;

    return (
        <ul className={`space-y-1.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 ${className}`}>
            {issues.map((message, index) => (
                <li key={index} className='flex items-start gap-2 text-sm text-red-700'>
                    <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
                    {message}
                </li>
            ))}
        </ul>
    );
};

export default IssueList;
