//Need to revise
/**
 * Split text into chunks for better AI processing
 * @param {string} text - Full text to chunk
 * @param {number} chunkSize - Target size per chunk
 * @param {number} overlap - Number of words to overlap between chunks
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number}}
 */
export const chunkText = (text, chunkSize=1000, overlap=100) => {
    if (!text || text.trim().length === 0) {
        return [];
    }

    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\s+/g).replace(/\n /g).replace(/ \n/g).trim();

    const paragraphs = cleanedText.split(/\n+/).filter(p => p.trim().length > 0);

    const chunks = [];
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const paragraphWords = paragraph.trim().split(/\s+/);
        const paragraphWordCount = paragraphWords.length;

        //If single paragraph exceed chunk size, split it by words
        if (paragraphWordCount > chunkSize) {
            if (currentChunk.length > 0) {
                chunks.push({
                    content: currentChunk.join('\n\n'),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0
                });
                currentChunk = [];
                currentWordCount = 0;
            }

            //Split large paragrah into word-based hunks
            for(let i = 0; i < paragraphWords.length; i+= (chunkSize - overlap)) {
                const chunkWords = paragraphWords.slice(i, i + chunkSize);
                chunks.push({
                    content: chunkWords.join(' '),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0
                });

                if (i + chunkSize >= paragraphWords.length) {
                    break;
                }
            }
            continue;
        }

        //If adding this paragraph exceeds chunk size. ave current chunk
        if (currentWordCount + paragraphWordCount > chunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join('\n\n'),
                chunkIndex: chunkIndex++,
                pageNumber: 0
            });

            //Create overlap from previous ccfhunk
            const previousChunkText = currentChunk.join(' ');
            const previousWord = previousChunkText.split(/\s+/);
            const overlapText = previousWord.slice(-Math.min(overlap, previousWord.length)).join(' ');

            currentChunk = [overlapText, paragraph.trim()];
            currentWordCount = overlapText.split(/\s+/).length + paragraphWordCount;

        } else {
            //Add paragraph to current chunks
            currentChunk.push(paragraph.trim());
            currentWordCount += paragraphWordCount;
        }
    }

    //Add the last chuk
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join('\n\n'),
            chunkIndex: chunkIndex,
            pageNumber: 0
        });
    }

    //Fallback: if no chunks created, split by words
    if (chunks.length === 0 && cleanedText.length > 0) {
        const allWords = cleanedText.split(/\s+/);

        for (let i = 0; i < allWords.length; i += (chunkSize - overlap)) {
            const chunkWords = allWords.slice(i, i + chunkSize);

            chunks.push({
                content: chunkWords.join(' '),
                chunkIndex: chunkIndex++,
                pageNumber: 0
            });

            if (i + chunkSize >= allWords.length) {
                break;
            }
        }
    }
    return chunks;
    
};

/**
 * Find relevant chunks based on keywords matching
 * @param {Array<Object>} chunks - Array of chunks
 * @param {struing} query - Searc query
 * @param {number} maxChunks - Mximum chunkx to return
 * @returns {Array<Object>}
 */
export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
    if (!chunks || chunks.length === 0 || !query) {
        return [];
    }

    //Common stiop words to exsclude
    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to',
        'for', 'of', 'as', 'by', 'this', 'that', 'it'

    ]);

    //Extract and clean query words
    const queryWords = query.toLowerCase().split(/\s+/).filter(x => x.length > 2 && !stopWords.has(x));

    if (queryWords.length === 0) {
        //Return clean chunks object without MySQL metadata
        return chunks.slice(0, maxChunks).map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            id: chunk.id
        }));
    }
    
    const scoredChunks = chunks.map((chunk, index) => {
        const content = chunk.content.toLowerCase();
        const contentWords = content.split(/\s+/).length;
        let score = 0;

        //Score each query word
        for (const word of queryWords) {
            //Exact word match (higher score)
            const exactMatch = (content.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
            score += exactMatch * 3;

            //Partial match (lower score)
            const partialMatch = (content,match(new RegExp(word, 'g')) || []).length;
            score += Math.max(0, partialMatch - exactMatch) * 1.5;
        }

        //Bonus: Multiple query words found
        const uniqueWordsFound = queryWords.filter(word => content.include(word)).length;

        if (uniqueWordsFound > 1) {
            score += uniqueWordsFound * 2;
        }

        //Normalize the content length
        const normalizeScore = score / Math.sqrt(contentWords);

        //Small bonus for earlier chunks
        const positionBonus = 1 - (index / chunk.length) * 0.1;

        //Return clean object without MySQL metadata
        return {
            id: chunk.id,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            pageNumber: chunk.pageNumber,
            score: normalizeScore * positionBonus,
            rawScore: score,
            matchedWords: uniqueWordsFound
        };
    });

    return scoredChunks.filter(chunk => chunk.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }

                if (b.matchedWords !== a.matchedWords) {
                    return b.matchedWords - a.matchedWords;
                }

                return a.chunkIndex - b.chunkIndex;

            }).slice(0, maxChunks);

};