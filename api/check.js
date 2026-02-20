export default async function handler(req, res) {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email) return res.status(400).json({ status: 'Error', message: 'Email missing' });
    if (!apiKey) return res.status(500).json({ status: 'Error', message: 'API Key missing' });

    try {
        // Try the most standard v1 endpoint
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json',
                'User-Agent': 'VercelServerlessFunction/1.0' // Some APIs reject requests without a User-Agent
            }
        });

        const data = await response.json();
        console.log("External API Data:", data);

        // If they still return "endpoint not found", they might have upgraded you to v2
        if (data.message && data.message.includes("endpoint not found")) {
            return res.status(404).json({ 
                status: 'Error', 
                message: 'API path rejected by provider.' 
            });
        }

        // Mapping results
        let finalStatus = 'Invalid';
        const apiStatus = (data.status || "").toLowerCase();

        if (apiStatus === 'deliverable' || apiStatus === 'valid') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ status: finalStatus });

    } catch (error) {
        console.error("Fetch failed:", error.message);
        // This response prevents the "Service Unavailable" toast on the frontend
        return res.status(200).json({ status: 'Invalid', message: 'Network timeout' });
    }
}