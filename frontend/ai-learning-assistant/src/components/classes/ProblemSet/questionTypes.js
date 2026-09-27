import { CircleDot, TextCursorInput, FileText } from 'lucide-react';

//title must match DEFAULT_TITLES in backend/models/ProblemSet.js.
export const QUESTION_TYPES = [
    { value: 'mcq', label: 'Multiple choice', title: 'Multiple Choice Question', hint: 'Students pick the one correct answer.', icon: CircleDot },
    { value: 'fill_blank', label: 'Fill in the Blank', title: 'Fill in the Blank', hint: 'Students type the hidden words in a passage.', icon: TextCursorInput },
    { value: 'open_ended', label: 'Open-Ended Question', title: 'Open-Ended Question', hint: 'Students write a free answer; you can attach files.', icon: FileText }
];

export const getQuestionType = (value) => QUESTION_TYPES.find((t) => t.value === value) || QUESTION_TYPES[0];

//Every blank's text in a fill-in-the-blank passage, in reading order (the backend's getBlanks does the same).
export const getBlanks = (html) => {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return [...doc.querySelectorAll('span[data-blank]')].map((el) => el.textContent.trim());
};
