export default async function handler(req, res) {
    // 1. Get the email from the URL
    const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
    const email = searchParams.get('email');
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    // 2. Safety Checks
    if (!email) return res.status(400).json({ status: 'Error', message: 'Email required' });
    if (!apiKey) {
        console.error("Missing API Key in Vercel Environment Variables");
        return res.status(500).json({ status: 'Error', message: 'Server config error' });
    }

    try {
        // 3. Call EmailDetective (Using the exact v1 endpoint)
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json'
            }
        });

        // 4. Handle API provider errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Provider Error:", errorText);
            // Return 'Invalid' instead of crashing to keep the UI smooth
            return res.status(200).json({ status: 'Invalid', message: 'Provider rejected request' });
        }

        const data = await response.json();
        console.log("API Response:", data);

        // 5. Logic Mapping
        let finalStatus = 'Invalid';
        const apiStatus = (data.status || "").toLowerCase();

        if (apiStatus === 'deliverable' || apiStatus === 'valid') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ status: finalStatus });

    } catch (error) {
        console.error("Function Crash:", error.message);
        // Fallback so the frontend doesn't show "Service Unavailable"
        return res.status(200).json({ status: 'Invalid', error: error.message });
    }
}