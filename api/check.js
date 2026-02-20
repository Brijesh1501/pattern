// This version removes the url.parse warning entirely
export default async function handler(req, res) {
    // 1. Modern way to get params (Fixes DEP0169)
    const url = new URL(req.url, `https://${req.headers.host}`);
    const email = url.searchParams.get('email');
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email) return res.status(400).json({ status: 'Error', message: 'No email' });
    if (!apiKey) return res.status(500).json({ status: 'Error', message: 'No API Key' });

    try {
        // 2. Try the "Absolute" endpoint path
        // Some accounts require v1.0 or just /verify. We will try the most common fallback.
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}&api_key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Vercel-Checker' // Some APIs 404 if no User-Agent is present
            }
        });

        const data = await response.json();
        console.log("Final Debug Log:", data);

        // 3. Handle specific provider error messages
        if (data.message && data.message.includes("endpoint not found")) {
            // If it still fails, let's try to return the raw message so you can see it
            return res.status(200).json({ status: 'Invalid', raw: 'Endpoint Error' });
        }

        let finalStatus = 'Invalid';
        const apiStatus = (data.status || "").toLowerCase();

        if (apiStatus === 'deliverable' || apiStatus === 'valid') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ status: finalStatus });

    } catch (error) {
        console.error("Critical Runtime Error:", error.message);
        return res.status(200).json({ status: 'Invalid' });
    }
}