// services/aws.js
require('dotenv').config();
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-west-2' });

/**
 * Get a secret from AWS Secrets Manager using the token (partial name).
 * @param {string} token - The user token (part of secret name)
 * @returns {Promise<object>} - Parsed secret JSON
 */
const getSecretByToken = async (token) => {
    const secretId = token;
    const command = new GetSecretValueCommand({ SecretId: secretId });
    try {
        const result = await secretsClient.send(command);
        return JSON.parse(result.SecretString || '{}');
    } catch (err) {
        if (err.name === 'ResourceNotFoundException') {
            throw new Error('Secret not found for token: ' + token);
        }
        throw err;
    }
};

module.exports = {
    getSecretByToken,
};
