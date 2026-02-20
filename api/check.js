export default async function handler(req, res) {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    // 1. Check for API Key immediately
    if (!apiKey) {
        console.error("ERROR: EMAILDETECTIVE_API_KEY is not defined in Vercel.");
        return res.status(500).json({ status: 'Error', message: 'API Key missing from Environment Variables' });
    }

    if (!email) {
        return res.status(400).json({ status: 'Error', message: 'No email provided' });
    }

    try {
        // The URL format for EmailDetective v1
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json'
            }
        });

        // Check if the external API itself is down or rejecting the key
        if (!response.ok) {
            const errorData = await response.text();
            console.error("EmailDetective API returned an error:", errorData);
            return res.status(response.status).json({ status: 'Error', message: 'API provider error' });
        }

        const data = await response.json();
        console.log("Success! API Response:", data);

        // Mapping logic
        let finalStatus = 'Invalid';
        const apiStatus = (data.status || "").toLowerCase();

        if (apiStatus === 'deliverable' || apiStatus === 'valid') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ status: finalStatus });

    } catch (error) {
        console.error("Runtime Error:", error.message);
        return res.status(500).json({ status: 'Error', message: error.message });
    }
}