export default async function handler(req, res) {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    try {
        // EmailDetective typically uses a GET endpoint for single lookups
        const response = await fetch(`https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey, // Check their docs, sometimes it's 'Authorization': apiKey
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.message || 'API Error' });
        }

        const data = await response.json();

        /**
         * EmailDetective Response Mapping:
         * Typically returns: { "status": "deliverable", "is_catchall": true, ... }
         */
        
        // We map their specific strings to your existing frontend logic
        let status = 'Invalid';
        if (data.status === 'deliverable') {
            status = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (data.status === 'risky') {
            status = 'CatchAll';
        }

        res.status(200).json({
            status: status, // Matches your JS: 'Success', 'CatchAll', or 'Invalid'
            raw: data.status // Useful for debugging
        });

    } catch (error) {
        console.error('EmailDetective Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}