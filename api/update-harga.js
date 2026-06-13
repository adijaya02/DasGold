export default async function handler(req, res) {
    try {
        const response = await fetch(
            "https://pegadaian.co.id/gold/prices/savings"
        );

        const data = await response.json();

        const insert = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                    Prefer: "return=representation"
                },
                body: JSON.stringify({
                    tanggal: data.data.tglBerlaku,
                    harga_beli: Number(data.data.hargaBeli),
                    harga_jual: Number(data.data.hargaJual)
                })
            }
        );

        const result = await insert.text();

        res.status(200).json({
            status: insert.status,
            result
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}
