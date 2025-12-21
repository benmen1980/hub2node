require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');

const clientParams = {
    region: process.env.AWS_REGION || 'us-west-2'
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientParams.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}

const s3Client = new S3Client(clientParams);

/**
 * Uploads a file from a URL to S3
 * @param {string} fileUrl - The URL of the file to download
 * @param {string} fileName - The desired filename in S3 (without extension, will be auto-detected or default to pdf)
 * @param {string} folder - The folder in S3 bucket
 * @returns {Promise<string>} - The S3 URL of the uploaded file
 */
async function uploadPdfFromUrl(fileUrl, fileName, folder = 'pdfs') {
    try {
        if (!fileUrl) {
            // return empty string if fileUrl is not provided
            return '';
        }
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        const buffer = response.data;

        // only for pdf
        if (!fileName.endsWith('.pdf')) {
            fileName += '.pdf';
        }

        const key = `${folder}/${fileName}`;
        const bucketName = process.env.S3_BUCKET_NAME;

        if (!bucketName) {
            throw new Error('S3_BUCKET_NAME environment variable is not set');
        }

        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: 'application/pdf',
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`;

        console.log(`File uploaded to S3: ${s3Url}`);
        return s3Url;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
}

module.exports = { uploadPdfFromUrl };
