export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?select=*&order=tanggal.desc,id.desc&limit=1",
            {
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`
                }
            }
        );

        const data = await response.json();

        if (!data.length) {
            return res.status(200).json({
                harga_beli: 0,
                harga_jual: 0
            });
        }

        res.status(200).json(data[0]);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}
