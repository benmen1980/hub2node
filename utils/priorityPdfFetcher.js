const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');

// Create a custom agent to handle legacy SSL if needed
const agent = new https.Agent({ rejectUnauthorized: false });

const client = axios.create({
    httpsAgent: agent,
    maxRedirects: 5,
    timeout: 30000,
    validateStatus: status => status < 500
});

/**
 * Fetches a PDF from a Priority source, detecting and handling login if necessary.
 * @param {string|Buffer|object} source - URL, data URI, %PDF string, Buffer, or object with url/dataUri
 * @param {string} username - Priority username
 * @param {string} password - Priority password
 * @returns {Promise<Buffer>} - The PDF file buffer
 */
async function fetchPriorityPdf(source, username, password) {
    const normalizeSource = (input) => {
        if (Buffer.isBuffer(input)) return input;
        if (input && typeof input === 'object') {
            const dataUri = input.dataUri || input.datauri || input.filedata;
            if (dataUri) return dataUri;
            if (input.url) return input.url;
        }
        return input;
    };

    const decodeDataUri = (dataUri) => {
        const base64 = dataUri.split(',')[1] || '';
        if (!base64) {
            throw new Error('PDF data URI missing base64 payload');
        }
        return Buffer.from(base64, 'base64');
    };

    const normalized = normalizeSource(source);

    if (Buffer.isBuffer(normalized)) {
        return normalized;
    }

    if (typeof normalized !== 'string' || normalized.trim() === '') {
        throw new Error('Invalid PDF source');
    }

    if (normalized.startsWith('data:')) {
        return decodeDataUri(normalized);
    }

    if (normalized.startsWith('%PDF-')) {
        return Buffer.from(normalized, 'latin1');
    }

    const url = normalized;
    console.log(`[PriorityPdfFetcher] Fetching: ${url}`);

    try {
        // Step 1: Initial GET
        let response = await client.get(url, { responseType: 'arraybuffer' });
        let contentType = response.headers['content-type'] || '';

        // If it's already a PDF, return it
        if (contentType.includes('application/pdf')) {
            console.log('[PriorityPdfFetcher] URL returned PDF directly.');
            return response.data;
        }

        // If it's not HTML, we can't handle it
        if (!contentType.includes('text/html')) {
            throw new Error(`Unexpected content type: ${contentType}`);
        }

        console.log('[PriorityPdfFetcher] HTML login form detected. Logging in...');

        // Step 2: Parse Form using Cheerio (Robust)
        const html = response.data.toString('utf8');
        const $ = cheerio.load(html);
        const $form = $('form').first();

        if ($form.length === 0) {
            throw new Error('[PriorityPdfFetcher] No login form found in HTML response.');
        }

        // Extract Action URL
        let actionUrl = $form.attr('action') || url;
        if (!actionUrl.startsWith('http')) {
            const parsedUrl = new URL(url);
            if (actionUrl.startsWith('/')) actionUrl = parsedUrl.origin + actionUrl;
            else actionUrl = url.substring(0, url.lastIndexOf('/') + 1) + actionUrl;
        }

        // Extract All Inputs
        const params = new URLSearchParams();
        $('input').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).val() || '';
            if (name) {
                // Don't add if it's the username/password field (we'll set them manually)
                if (name.toUpperCase() !== 'NAM' && name.toUpperCase() !== 'PAS') {
                    params.append(name, value);
                }
            }
        });

        // Add Credentials
        params.append('NAM', username);
        params.append('PAS', password);

        // Cookies
        const initialCookies = response.headers['set-cookie'];
        let cookieHeader = initialCookies ? initialCookies.map(c => c.split(';')[0]).join('; ') : '';

        // Step 3: Login POST
        const loginResponse = await client.post(actionUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookieHeader
            },
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });

        // Update Cookies
        const loginCookies = loginResponse.headers['set-cookie'];
        if (loginCookies) {
            const newCookies = loginCookies.map(c => c.split(';')[0]).join('; ');
            cookieHeader = cookieHeader ? `${cookieHeader}; ${newCookies}` : newCookies;
        }

        // Step 4: Re-fetch PDF
        console.log('[PriorityPdfFetcher] Re-fetching PDF with session cookies...');
        const pdfResponse = await client.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'Cookie': cookieHeader
            }
        });

        if (pdfResponse.headers['content-type'].includes('application/pdf')) {
            console.log(`[PriorityPdfFetcher] PDF downloaded successfully (${pdfResponse.data.length} bytes).`);
            return pdfResponse.data;
        } else {
            console.error('[PriorityPdfFetcher] Failed to get PDF content type after login.');
            throw new Error(`Login appeared successful but PDF fetch returned: ${pdfResponse.headers['content-type']}`);
        }

    } catch (err) {
        console.error('[PriorityPdfFetcher] Error:', err.message);
        throw err;
    }
}

module.exports = { fetchPriorityPdf };
