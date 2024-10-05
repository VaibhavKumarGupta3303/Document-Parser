import officeParser from 'officeparser';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import { config } from 'dotenv';
import r_prompt from './pdf/resume_prompt.js';
import i_prompt from './image/image_prompt.js';
import d_prompt from './document/document_prompt.js';
import path from 'path';
import Tesseract from 'tesseract.js';

// Load environment variables
config({ path: './key.env' });

// Initialize Google Generative AI model
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API key is missing. Please check your .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

let final_prompt = '';

async function fun() {
    const pdfPath = "./medical.jpg";
    // Helper function to get the file type
    function getFileType(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        switch (ext) {
            case '.pdf':
                return 'PDF Document';
            case '.docx':
                return 'Word Document';
            case '.jpg':
            case '.jpeg':
            case '.png':
                return 'Image File';
            default:
                return 'Unknown file type';
        }
    }

    // Check if the PDF file exists
    if (!fs.existsSync(pdfPath)) {
        console.error(`The file ${pdfPath} does not exist.`);
        return;
    }

    const fileType = getFileType(pdfPath);

    // Define promises based on file type
    let result;
    if (fileType === 'PDF Document' || fileType === 'Word Document') {
        final_prompt = fileType === 'PDF Document' ? r_prompt : d_prompt;
        result = new Promise((resolve, reject) => {
            officeParser.parseOffice(pdfPath, function (data, err) {
                if (err) {
                    reject("Error reading the file: " + err);
                } else if (data) {
                    resolve(data);
                } else {
                    reject("No data found in the file.");
                }
            });
        });
    } else if (fileType === 'Image File') {
        final_prompt = i_prompt;
        result = Tesseract.recognize(
            pdfPath, 'eng', {
                logger: info => console.log(info)
            }
        ).then(({ data: { text } }) => {
            console.log("Extracted text from the image:", text);
            return text;
        }).catch(err => {
            console.error("Tesseract error:", err);
        });
    } else {
        console.log("File type not recognized");
        return;
    }

    // Process the extracted content and interact with the model
    try {
        const extractedText = await result;

        const prompt = `
        // Here is resume data extracted from a document:
        ${JSON.stringify(extractedText)}
        The syntax is: ${final_prompt}
        `;

        const api_result = await model.generateContent(prompt);
        const responseData = api_result.response.text()
            .replace(/#/g, '') // Remove '#' symbols
            .replace(/\*/g, '') // Remove '*' symbols
            .replace(/(\r\n|\n|\r)/g, '\n'); // Normalize all new lines to '\n'

        // Save the result to a file
        fs.writeFileSync('resume_categorization_response.json', responseData, 'utf8');
        console.log("Response saved to resume_categorization_response.json");
    } catch (error) {
        console.error("Error:", error);
    }
}

fun();
