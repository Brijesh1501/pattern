/**
 * Modern ESM Serverless Function for Vercel
 * Works with "type": "module" in package.json
 */
export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email) {
        return res.status(400).json({ status: 'Error', message: 'Email is required' });
    }

    if (!apiKey) {
        return res.status(500).json({ status: 'Error', message: 'API Key missing in Vercel' });
    }

    try {
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ status: 'Error', message: 'API Error' });
        }

        const data = await response.json();
        
        let finalStatus = 'Invalid';
        if (data.status === 'deliverable') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (data.status === 'risky') {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ status: finalStatus });

    } catch (error) {
        return res.status(500).json({ status: 'Error', message: error.message });
    }
}