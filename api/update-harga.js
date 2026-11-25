import { generateDataAset } from "./lib/generateDataAset.js";

export default async function handler(req, res) {
    // Hanya izinkan GET (Vercel Cron) dan POST (trigger manual)
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    // Opsional: validasi otomatis jika CRON_SECRET diatur di Vercel Environment Variables
    if (process.env.CRON_SECRET) {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }
    }

    console.log("CRON START:", new Date().toISOString());

    try {
        if (!process.env.SUPABASE_KEY) {
            throw new Error("Environment variable SUPABASE_KEY belum diatur");
        }

        // 1. Ambil data harga dari Pegadaian dengan header lengkap & timeout 15 detik
        const response = await fetch("https://pegadaian.co.id/gold/prices/savings", {
            headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            signal: AbortSignal.timeout(15000)
        });

        console.log("PEGADAIAN STATUS:", response.status);

        if (!response.ok) {
            throw new Error(`Pegadaian API error: ${response.status}`);
        }

        const payload = await response.json();
        const goldData = payload?.data;

        if (!goldData || !goldData.tglBerlaku) {
            throw new Error("Struktur data Pegadaian tidak valid atau kosong");
        }

        // Harga Jual Pegadaian = Harga Beli User, Harga Beli Pegadaian = Harga Jual User
        const tanggal = String(goldData.tglBerlaku).trim();
        const hargaBeliUser = Number(goldData.hargaJual);
        const hargaJualUser = Number(goldData.hargaBeli);

        if (!Number.isFinite(hargaBeliUser) || hargaBeliUser <= 0 ||
            !Number.isFinite(hargaJualUser) || hargaJualUser <= 0) {
            throw new Error(`Nilai harga tidak valid: beli=${goldData.hargaJual}, jual=${goldData.hargaBeli}`);
        }

        // 2. Simpan ke Supabase (Upsert berdasarkan tanggal)
        const supabaseUrl = process.env.SUPABASE_URL || "https://zasjkgrmcvigblpyqsff.supabase.co";
        const insert = await fetch(
            `${supabaseUrl}/rest/v1/harga_emas?on_conflict=tanggal`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                    Prefer: "resolution=merge-duplicates,return=representation"
                },
                body: JSON.stringify({
                    tanggal,
                    harga_beli: hargaBeliUser,
                    harga_jual: hargaJualUser
                })
            }
        );

        const rawResult = await insert.text();
        let result = null;
        try {
            result = rawResult ? JSON.parse(rawResult) : null;
        } catch {
            result = rawResult;
        }

        console.log("SUPABASE STATUS:", insert.status);

        if (!insert.ok) {
            throw new Error(`Supabase error (${insert.status}): ${JSON.stringify(result)}`);
        }

        console.log("HARGA BERHASIL DISIMPAN");

        // 3. Generate data aset otomatis
        console.log("GENERATE DATA ASET...");
        const aset = await generateDataAset();
        console.log("GENERATE SELESAI");

        return res.status(200).json({
            success: true,
            harga: result,
            data_aset: aset
        });

    } catch (err) {
        console.error("CRON ERROR:", err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}
