function getPublicUrl(req, path) {
    const host = req.get('host') || '';
    const isLocal = host.startsWith('localhost:') || host.startsWith('127.0.0.1:') || host === 'localhost' || host === '127.0.0.1';
    const protocol = isLocal ? 'http' : 'https';
    return `${protocol}://${host}${path}`;
}

module.exports = { getPublicUrl };
