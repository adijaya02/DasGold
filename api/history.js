export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?select=tanggal,harga_beli,harga_jual&order=tanggal.asc",
            {
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`
                }
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
