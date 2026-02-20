// Use require instead of import for maximum compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!apiKey) {
        return res.status(500).json({ error: 'Server Config Error: API Key Missing' });
    }

    try {
        const response = await fetch(`https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Upstream API Error' });
        }

        const data = await response.json();
        
        // Mapping logic
        let status = 'Invalid';
        if (data.status === 'deliverable') {
            status = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (data.status === 'risky') {
            status = 'CatchAll';
        }

        return res.status(200).json({ status: status });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};