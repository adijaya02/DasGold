export default async function handler(req, res) {
    console.log("CRON START:", new Date().toISOString());

    try {
        const response = await fetch(
            "https://pegadaian.co.id/gold/prices/savings"
        );

        console.log("PEGADAIAN STATUS:", response.status);

        if (!response.ok) {
            throw new Error(`Pegadaian API error: ${response.status}`);
        }

        const data = await response.json();

        console.log("DATA:", data);

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

        console.log("SUPABASE STATUS:", insert.status);

        const result = await insert.text();

        console.log("SUPABASE RESPONSE:", result);
        console.log("DONE");

        return res.status(200).json({
            status: insert.status,
            result
        });

    } catch (err) {
        console.error("ERROR:", err);

        return res.status(500).json({
            error: err.message
        });
    }
}
