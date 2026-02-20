export default async function handler(req, res) {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email) return res.status(400).json({ status: 'Error', message: 'No email' });
    if (!apiKey) return res.status(500).json({ status: 'Error', message: 'No API Key' });

    try {
        // We are moving the API key to the Query Parameter (URL) 
        // and using the most compatible v1 path.
        const apiUrl = `https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}&api_key=${apiKey}`;

        console.log(`Checking: ${email}`);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
                // We removed the x-api-key header here because we put it in the URL above
            }
        });

        const data = await response.json();
        console.log("Raw API Response:", data);

        // Map the results
        let finalStatus = 'Invalid';
        const apiStatus = (data.status || "").toLowerCase();

        if (apiStatus === 'deliverable') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (apiStatus === 'risky' || data.is_catchall === true) {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ status: finalStatus });

    } catch (error) {
        console.error("Fetch Error:", error.message);
        return res.status(200).json({ status: 'Invalid' });
    }
}