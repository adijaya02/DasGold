export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?select=*&order=tanggal.desc&limit=1",
            {
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`
                }
            }
        );

        const data = await response.json();

        if (!data || data.length === 0) {
            return res.json({
                harga_beli: 0,
                harga_jual: 0,
                tanggal: null
            });
        }

        res.json(data[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
