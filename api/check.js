export default async function handler(req, res) {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    // 1. Validation
    if (!email) return res.status(400).json({ status: 'Error', message: 'No email provided' });
    if (!apiKey) return res.status(500).json({ status: 'Error', message: 'API Key not configured in Vercel' });

    try {
        // 2. Updated URL Structure
        // Some API versions require the key in the URL itself to avoid "endpoint not found" errors
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}&api_key=${apiKey}`;

        console.log(`Pinging EmailDetective for: ${email}`);

        const response = await fetch(apiUrl, {
            method: 'GET', // Explicitly GET
            headers: {
                'Accept': 'application/json'
                // Removed x-api-key header to prevent "Invalid Method" conflicts
            }
        });

        const data = await response.json();
        
        // This will now show the REAL data instead of the error message
        console.log("EmailDetective Raw Response:", JSON.stringify(data));

        // 3. Handle the "Endpoint Not Found" if it persists
        if (data.message && data.message.includes("endpoint not found")) {
            return res.status(404).json({ 
                status: 'Error', 
                message: 'API Endpoint mismatch. Check EmailDetective documentation for V1 vs V2.' 
            });
        }

        // 4. Mapping Logic
        let finalStatus = 'Invalid';
        
        // EmailDetective usually returns "deliverable", "risky", or "undeliverable"
        const apiStatus = (data.status || "").toLowerCase();

        if (apiStatus === 'deliverable') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        } else if (apiStatus === 'undeliverable') {
            finalStatus = 'Invalid';
        }

        return res.status(200).json({ 
            status: finalStatus,
            raw: apiStatus 
        });

    } catch (error) {
        console.error("Serverless Function Error:", error.message);
        return res.status(500).json({ status: 'Error', message: error.message });
    }
}