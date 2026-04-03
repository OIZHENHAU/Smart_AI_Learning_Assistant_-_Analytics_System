import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';

/**
 * Extract the tecxt from the pdf file
 * @param {string} filePath - the path of the pdf file
 * @returns {Promise<{text: string, numPages: number}>}
 */
export const extractTextFromPDFFile = async (filePath) => {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const parser = new PDFParse(new Uint8Array(dataBuffer));
        const dataFile = await parser.getText();

        return {
            text: dataFile.text,
            numPages: dataFile.numpages
        };

    } catch (error) {
        console.error("Fail to retrieve text from the pdf file due to: " + error);

    }
}