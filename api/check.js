export default async function handler(req, res) {
    const { email } = req.query;
    const apiKey = process.env.EMAILDETECTIVE_API_KEY;

    if (!email) {
        return res.status(400).json({ status: 'Error', message: 'Email is required' });
    }

    try {
        const response = await fetch(`https://api.emaildetective.io/v1/verify?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        
        let finalStatus = 'Invalid';
        if (data.status === 'deliverable') {
            finalStatus = data.is_catchall ? 'CatchAll' : 'Success';
        } else if (data.status === 'risky') {
            finalStatus = 'CatchAll';
        }

        return res.status(200).json({ status: finalStatus });
    } catch (error) {
        return res.status(500).json({ status: 'Error', message: error.message });
    }
}