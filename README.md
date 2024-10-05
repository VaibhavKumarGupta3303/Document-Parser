import officeParser from 'officeparser';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import { config } from 'dotenv';
import r_prompt from './pdf/resume_prompt.js';
import i_prompt from './image/image_prompt.js';
import d_prompt from './document/document_prompt.js';
import path from 'path';
import Tesseract from 'tesseract.js';

These are the neccesary imports to open the file , use genApi , dotenv(to store your API key) , and i_prompt,d_prompt,r_prompt(are the prompt that will awake the special promt for the document type , i =image , d=document, r=resume)


const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

This allow us to connect the code witht he GENAPI  and use GEMINI

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

    This is use to check the file extension and return the type of file.

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

The file type extracted is then passed to officeParser to extract the text from pdf and document and for image it is passes to tesseract to extract its data 

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

in this the Asynchronous type is handled and the prompt is awaken for that particular file type and then the structuring and cleaning in done on data  and with utilizing the feature of FileSync i have created the file and stored the data in it.
