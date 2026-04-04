// utils/PptParser.js
import fs from "fs";
import officeParser from "officeparser";

export const extractTextFromPPT = async (filePath) => {
    try {
        const data = await officeParser.parseOffice(filePath);

        console.log("RAW PPT DATA:", data); // debug

        let text = "";

        if (typeof data === "string") {
            text = data;
        } else if (Array.isArray(data)) {
            text = data.join(" ");
        } else if (typeof data === "object") {
            text = JSON.stringify(data); // fallback
        }

        return text;

    } catch (error) {
        console.error("Error parsing PPT:", error);
        return "";
    }
};