export default async function handler(req, res) {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // You can get your API Token from the Verifalia Dashboard
    const apiToken = process.env.VERIFALIA_API_TOKEN;

    try {
        const response = await fetch('https://api.verifalia.com/v2.4/email-validations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entries: [{ inputData: email }],
                // 'Power' or 'Standard' - 'Standard' is cheaper/faster for free tiers
                quality: 'Standard' 
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.message || 'Verifalia API Error' });
        }

        const data = await response.json();
        
        // Verifalia returns an 'entries' array. We check the first one.
        // Status 'Success' means the email is deliverable.
        const entry = data.entries[0];
        
        res.status(200).json({
            isValid: entry.status === 'Success',
            status: entry.status, // e.g., 'Success', 'Undeliverable', 'CatchAll'
            classification: entry.classification // e.g., 'Deliverable', 'Undeliverable'
        });

    } catch (error) {
        console.error('Serverless Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}