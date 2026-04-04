// utils/WordParser.js
import mammoth from "mammoth";
import fs from "fs/promises";

export const extractTextFromWord = async (filePath) => {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });

    return result.value; // plain text
};