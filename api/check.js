export default async function handler(req, res) {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    // 1. Basic Validation
    if (!email) {
        return res.status(400).json({ status: 'Error', message: 'No email provided' });
    }
    if (!apiKey) {
        console.error("CRITICAL: EMAILDETECTIVE_API_KEY is not set in Vercel Environment Variables.");
        return res.status(500).json({ status: 'Error', message: 'Server configuration error' });
    }

    try {
        // 2. The API URL (Fixed to match standard EmailDetective v1 structure)
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}&api_key=${apiKey}`;

        console.log(`Requesting verification for: ${email}`);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        // 3. LOGGING: This helps you debug the "endpoint not found" error
        console.log("Full API Response:", JSON.stringify(data));

        // 4. Handle API-level Errors (like "endpoint not found")
        if (data.message && data.message.includes("endpoint not found")) {
            return res.status(500).json({ 
                status: 'Error', 
                message: 'Internal API URL Mismatch' 
            });
        }

        /**
         * 5. MAPPING LOGIC
         * Translates API response into 'Success', 'CatchAll', or 'Invalid'
         */
        let finalStatus = 'Invalid';
        const apiStatus = data.status ? data.status.toLowerCase() : '';

        // Check for 'deliverable' or 'valid'
        if (apiStatus === 'deliverable' || apiStatus === 'valid') {
            // Further check if the domain is a catch-all
            finalStatus = data.is_catchall === true ? 'CatchAll' : 'Success';
        } 
        else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ 
            status: finalStatus,
            raw: apiStatus // Sent back so you can see the original status in browser console
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        return res.status(500).json({ status: 'Error', message: 'Service Timeout or Network Error' });
    }
}