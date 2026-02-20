// Use module.exports instead of export default
module.exports = async (req, res) => {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email) return res.status(400).json({ status: 'Error', message: 'No email provided' });
    if (!apiKey) return res.status(500).json({ status: 'Error', message: 'API Key missing' });

    try {
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`;
        
        // We use a dynamic import for fetch because it's an ESM-only package in newer Node versions
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'x-api-key': apiKey }
        });

        const data = await response.json();

        let finalStatus = 'Invalid';
        if (data.status === 'deliverable') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        }

        return res.status(200).json({ status: finalStatus });
    } catch (err) {
        return res.status(500).json({ status: 'Error', message: err.message });
    }
};