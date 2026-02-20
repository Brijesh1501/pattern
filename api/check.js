export default async function handler(req, res) {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    // 1. Initial Checks
    if (!email) return res.status(400).json({ status: 'Error', message: 'No email provided' });
    if (!apiKey) return res.status(500).json({ status: 'Error', message: 'API Key missing' });

    try {
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        // LOGGING: This is vital. Check this in your Vercel Logs tab!
        console.log(`Verifying: ${email} | API Response:`, JSON.stringify(data));

        /**
         * 2. BROAD MAPPING LOGIC
         * EmailDetective usually returns "deliverable", "undeliverable", or "risky"
         */
        let finalStatus = 'Invalid';
        const apiStatus = data.status ? data.status.toLowerCase() : '';

        if (apiStatus === 'deliverable') {
            // Check if it's a catch-all (common in business domains)
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } 
        else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        }
        else if (apiStatus === 'undeliverable' || apiStatus === 'invalid') {
            finalStatus = 'Invalid';
        }

        return res.status(200).json({ 
            status: finalStatus,
            raw: apiStatus // Sending raw status back for debugging
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        return res.status(500).json({ status: 'Error', message: error.message });
    }
}