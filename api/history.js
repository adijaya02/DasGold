export default async function handler(req, res) {
    try {

        const url =
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?select=tanggal,harga_beli,harga_jual&order=tanggal.asc";

        const response = await fetch(url, {
            headers: {
                apikey: process.env.SUPABASE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        res.status(200).json(data);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}
