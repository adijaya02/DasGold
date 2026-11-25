export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        if (!process.env.SUPABASE_KEY) {
            throw new Error("Environment variable SUPABASE_KEY belum diatur");
        }

        const supabaseUrl =
            process.env.SUPABASE_URL || "https://zasjkgrmcvigblpyqsff.supabase.co";

        const response = await fetch(
            `${supabaseUrl}/rest/v1/harga_emas?select=tanggal,harga_beli,harga_jual&order=tanggal.desc,id.desc&limit=1`,
            {
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Supabase error (${response.status}): ${JSON.stringify(data)}`);
        }

        res.setHeader("Cache-Control", "no-store");

        if (!Array.isArray(data) || !data.length) {
            return res.status(200).json({
                tanggal: null,
                harga_beli: 0,
                harga_jual: 0
            });
        }

        return res.status(200).json({
            tanggal: data[0].tanggal,
            harga_beli: Number(data[0].harga_beli) || 0,
            harga_jual: Number(data[0].harga_jual) || 0
        });

    } catch (err) {
        console.error("ERROR /api/harga:", err);
        return res.status(500).json({
            error: err.message
        });
    }
}
