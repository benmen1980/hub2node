const puppeteer = require('puppeteer');
const htmlToPdf = require('html-pdf-node');

async function renderAuthenticatedPriorityPdf(url, loginResult, credentials, options = {}) {
    const constants = await loginResult.constants();
    const reportHost = new URL(url).hostname;
    const cookies = [];

    if (constants.htmlsvccookie) {
        cookies.push({ name: 'PriUserV2', value: constants.htmlsvccookie, domain: reportHost, path: '/' });
    }
    if (constants.mgcookie) {
        cookies.push({ name: 'PriUser', value: constants.mgcookie, domain: reportHost, path: '/' });
    }
    if (credentials?.profile?.company) {
        cookies.push({ name: 'Environment', value: credentials.profile.company, domain: reportHost, path: '/' });
    }

    const launchOptions = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    };
    let browser = await puppeteer.launch(launchOptions);

    try {
        const page = await browser.newPage();
        await page.setCookie(...cookies);
        await page.goto(url, { waitUntil: ['load', 'networkidle0'] });

        const pageUrl = page.url();
        const pageHtml = await page.content();
        if (/\/auth\/|oauth2|_netsession["'= ]+emptyhtml/i.test(pageUrl + pageHtml)) {
            throw new Error('Priority report opened the login page; authenticated session was not accepted');
        }

        const baseTag = `<base href="${new URL(url).origin}/">`;
        const printableHtml = pageHtml
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<meta\b[^>]*http-equiv=["']?refresh[^>]*>/gi, '')
            .replace(/\son(?:load|unload)\s*=\s*(["']).*?\1/gi, '');
        await browser.close();
        browser = null;
        return htmlToPdf.generatePdf(
            { content: printableHtml.replace('<head>', `<head>${baseTag}`) },
            { format: options.format || 'A4', printBackground: options.printBackground !== false }
        );
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { renderAuthenticatedPriorityPdf };
