import { generateDataAset } from "./lib/generateDataAset.js";

export default async function handler(req, res) {

    console.log("CRON START:", new Date().toISOString());

    try {

        // Ambil data harga dari Pegadaian
        const response = await fetch(
            "https://pegadaian.co.id/gold/prices/savings"
        );

        console.log("PEGADAIAN STATUS:", response.status);

        if (!response.ok) {
            throw new Error(`Pegadaian API error: ${response.status}`);
        }

        const data = await response.json();

        console.log("DATA:", data);

        // Simpan ke Supabase (Upsert)
        const insert = await fetch(
            "https://zasjkgrmcvigblpyqsff.supabase.co/rest/v1/harga_emas?on_conflict=tanggal",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                    Prefer: "resolution=merge-duplicates,return=representation"
                },
                body: JSON.stringify({
                    tanggal: data.data.tglBerlaku,
                    harga_beli: Number(data.data.hargaJual),
                    harga_jual: Number(data.data.hargaBeli)
                })
            }
        );

        const result = await insert.json();

        console.log("SUPABASE STATUS:", insert.status);

        if (!insert.ok) {
            throw new Error(JSON.stringify(result));
        }

        console.log("HARGA BERHASIL DISIMPAN");

        // ==============================
        // Generate data aset otomatis
        // ==============================

        console.log("GENERATE DATA ASET...");

        const aset = await generateDataAset();

        console.log("GENERATE SELESAI");

        return res.status(200).json({

            success: true,

            harga: result,

            data_aset: aset

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

}
