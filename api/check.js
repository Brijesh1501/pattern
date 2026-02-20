export default async function handler(req, res) {
    // 1. Get email using modern URL API to fix the warning
    const url = new URL(req.url, `https://${req.headers.host}`);
    const email = url.searchParams.get('email');
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email || !apiKey) {
        return res.status(400).json({ status: 'Error', message: 'Missing parameters' });
    }

    try {
        // 2. The URL format from the docs: /emails/[email-address]
        const apiUrl = `https://api.emaildetective.io/emails/${encodeURIComponent(email)}`;

        console.log(`Verifying via EmailDetective: ${email}`);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                // 3. The Header format from the docs: Authorization: <key>
                'Authorization': apiKey.trim(),
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errLog = await response.text();
            console.error("API Rejected Request:", errLog);
            return res.status(response.status).json({ status: 'Invalid', message: 'Provider Error' });
        }

        const data = await response.json();
        console.log("Real Data Received:", data);

        /**
         * 4. MAPPING LOGIC (Based on the Docs Example)
         * valid_email: true/false
         * score: number
         */
        let finalStatus = 'Invalid';

        if (data.valid_email === true) {
            // High score (usually > 80) is a clean success
            // If valid_mx is false, it's often a catch-all or risky
            if (data.score >= 80 && data.valid_mx === true) {
                finalStatus = 'Success';
            } else {
                finalStatus = 'CatchAll';
            }
        }

        return res.status(200).json({ 
            status: finalStatus,
            score: data.score // Sending back score for your own debugging
        });

    } catch (error) {
        console.error("Runtime Error:", error.message);
        return res.status(200).json({ status: 'Invalid' });
    }
}