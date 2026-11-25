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

        const url = `${supabaseUrl}/rest/v1/harga_emas?select=tanggal,harga_beli,harga_jual&order=tanggal.asc`;

        const response = await fetch(url, {
            headers: {
                apikey: process.env.SUPABASE_KEY,
                Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Supabase error (${response.status}): ${JSON.stringify(data)}`);
        }

        res.setHeader("Cache-Control", "no-store");

        const formatted = (Array.isArray(data) ? data : []).map((item) => ({
            tanggal: item.tanggal,
            harga_beli: Number(item.harga_beli) || 0,
            harga_jual: Number(item.harga_jual) || 0
        }));

        return res.status(200).json(formatted);

    } catch (err) {
        console.error("ERROR /api/history:", err);
        return res.status(500).json({
            error: err.message
        });
    }
}
