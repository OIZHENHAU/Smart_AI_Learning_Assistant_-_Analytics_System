import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

//Shows a fill-in-the-blank passage (already emptied by the server) and puts renderBlank(index) inside each
//<span data-blank> through a portal, so every blank stays inline in the passage's own paragraphs and formatting.
//The html must not change while mounted (key the parent by question), or the blanks would be rebuilt.
const BlankPassage = ({ html, renderBlank, className = '' }) => {
    const containerRef = useRef(null);
    const [slots, setSlots] = useState([]);
    //Memoised on purpose: React 19 compares this prop by object identity, so a new { __html } on every render
    //would rewrite the passage and throw away the <span data-blank> elements the blanks are portalled into.
    const markup = useMemo(() => ({ __html: html }), [html]);

    useLayoutEffect(() => {
        setSlots([...containerRef.current.querySelectorAll('span[data-blank]')]);
    }, [html]);

    return (
        <>
            <div ref={containerRef} className={`rich-content ${className}`} dangerouslySetInnerHTML={markup} />
            {slots.map((slot, index) => createPortal(renderBlank(index), slot, index))}
        </>
    );
};

export default BlankPassage;
