import { requireAdmin } from "./lib/auth.js";
import { generateDataAset } from "./lib/generateDataAset.js";

export default async function handler(req, res) {
    if (!requireAdmin(req, res)) return;

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed",
            message: "Method tidak diizinkan"
        });
    }

    try {
        if (!process.env.SUPABASE_KEY) {
            throw new Error("Environment variable SUPABASE_KEY belum diatur");
        }

        const body =
            typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

        const nominal = Math.round(Number(body.biaya_pembelian));
        const beratAset = Number(Number(body.aset).toFixed(4));
        const tanggalBeli = body.tanggal_beli
            ? String(body.tanggal_beli).trim().slice(0, 10)
            : "";

        if (!Number.isFinite(nominal) || nominal <= 0 ||
            !Number.isFinite(beratAset) || beratAset <= 0 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(tanggalBeli)) {
            return res.status(400).json({
                success: false,
                error: "Data tidak lengkap atau tidak valid",
                message: "Data pembelian tidak lengkap atau format tanggal salah"
            });
        }

        const supabaseUrl =
            process.env.SUPABASE_URL || "https://zasjkgrmcvigblpyqsff.supabase.co";

        // ==========================
        // Simpan investasi (Upsert per tanggal_beli)
        // ==========================
        const response = await fetch(
            `${supabaseUrl}/rest/v1/investasi?on_conflict=tanggal_beli`,
            {
                method: "POST",
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    Prefer: "resolution=merge-duplicates,return=representation"
                },
                body: JSON.stringify([
                    {
                        tanggal_beli: tanggalBeli,
                        biaya_pembelian: nominal,
                        aset: beratAset
                    }
                ])
            }
        );

        const rawText = await response.text();
        let data = null;
        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch {
            data = { message: rawText };
        }

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: data?.message || data?.error || "Gagal menyimpan ke Supabase",
                message: data?.message || data?.error || "Gagal menyimpan data investasi",
                details: data
            });
        }

        console.log("INVESTASI BERHASIL DISIMPAN");

        // ==========================
        // Generate data aset otomatis
        // ==========================
        console.log("GENERATE DATA ASET...");
        const hasilAset = await generateDataAset();
        console.log("GENERATE SELESAI");

        return res.status(200).json({
            success: true,
            investasi: data,
            data_aset: hasilAset
        });

    } catch (err) {
        console.error("ERROR /api/simpan-investasi:", err);

        return res.status(500).json({
            success: false,
            error: err.message,
            message: err.message
        });
    }
}
