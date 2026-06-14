export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { biaya_pembelian, aset } = req.body;

        const response = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/investasi",
            {
                method: "POST",
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    Prefer: "return=representation"
                },
                body: JSON.stringify([
                    {
                        biaya_pembelian,
                        aset
                    }
                ])
            }
        );

        const data = await response.json();

        res.status(200).json(data);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
}
