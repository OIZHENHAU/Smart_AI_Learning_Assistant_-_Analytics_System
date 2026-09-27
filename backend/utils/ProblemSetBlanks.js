//A fill-in-the-blank passage marks each blank as <span data-blank="">answer</span> (see FillBlankEditor).
//The passage editor has no font styles, so a blank never contains another <span>.
const BLANK_PATTERN = /<span\b[^>]*\bdata-blank\b[^>]*>([\s\S]*?)<\/span>/gi;

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const decode = (text) => text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity]);

//Every blank's answer, in reading order (blank 1 first).
export const getBlanks = (html = '') =>
    [...html.matchAll(BLANK_PATTERN)].map((match) => decode(match[1].replace(/<[^>]*>/g, '')).trim());

//Same passage with every answer removed, so it is safe to send to a student.
export const maskBlanks = (html = '') => html.replace(BLANK_PATTERN, '<span data-blank=""></span>');
