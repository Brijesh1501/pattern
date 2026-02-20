export default async function handler(req, res) {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const email = url.searchParams.get('email');
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email || !apiKey) {
        return res.status(400).json({ status: 'Error', message: 'Missing parameters' });
    }

    // List of possible endpoints to try
    const endpoints = [
        `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`,
        `https://api.emaildetective.io/verify?email=${encodeURIComponent(email)}`,
        `https://api.emaildetective.io/v1.0/verify?email=${encodeURIComponent(email)}`
    ];

    for (const apiUrl of endpoints) {
        try {
            console.log(`Trying endpoint: ${apiUrl}`);
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            // If we get the "endpoint not found" error, we continue to the next URL in the list
            if (data.message && data.message.includes("endpoint not found")) {
                console.warn(`Endpoint failed: ${apiUrl}`);
                continue; 
            }

            // If we reach here, we found the right endpoint!
            console.log("SUCCESS! Found working endpoint:", apiUrl);
            console.log("Data:", data);

            let finalStatus = 'Invalid';
            const apiStatus = (data.status || "").toLowerCase();

            if (apiStatus === 'deliverable' || apiStatus === 'valid') {
                finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
            } else if (apiStatus === 'risky' || data.is_catchall === true) {
                finalStatus = 'CatchAll';
            }

            return res.status(200).json({ status: finalStatus });

        } catch (err) {
            console.error(`Error with ${apiUrl}:`, err.message);
            continue;
        }
    }

    // If none of the endpoints worked
    return res.status(404).json({ 
        status: 'Error', 
        message: 'All API endpoints rejected the request. Check your API Key and plan.' 
    });
}