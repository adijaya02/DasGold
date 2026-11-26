export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const diag = {
        timestamp: new Date().toISOString(),
        method: req.method,
        env_check: {
            SUPABASE_URL: process.env.SUPABASE_URL || "(pakai default URL)",
            SUPABASE_KEY_ADA: Boolean(process.env.SUPABASE_KEY),
            SUPABASE_KEY_PREFIX: process.env.SUPABASE_KEY
                ? process.env.SUPABASE_KEY.slice(0, 12) + "..."
                : null,
            AUTH_SECRET_ADA: Boolean(process.env.AUTH_SECRET)
        },
        supabase_check: null,
        login_check: null
    };

    if (!process.env.SUPABASE_KEY) {
        return res.status(500).json({
            success: false,
            step: "ENV_CHECK",
            error: "SUPABASE_KEY belum diatur di Vercel Environment Variables",
            diag
        });
    }

    const supabaseUrl =
        process.env.SUPABASE_URL || "https://zasjkgrmcvigblpyqsff.supabase.co";

    try {
        // 1. Tes ambil semua baris di tabel "user"
        const response = await fetch(
            `${supabaseUrl}/rest/v1/user?select=id,user_name,password,role&order=id.asc`,
            {
                headers: {
                    apikey: process.env.SUPABASE_KEY,
                    Authorization: `Bearer ${process.env.SUPABASE_KEY}`
                }
            }
        );

        const rawText = await response.text();
        let rows = null;
        try {
            rows = rawText ? JSON.parse(rawText) : null;
        } catch {
            rows = rawText;
        }

        diag.supabase_check = {
            http_status: response.status,
            ok: response.ok,
            jumlah_baris_terbaca: Array.isArray(rows) ? rows.length : 0,
            daftar_user_terbaca: Array.isArray(rows)
                ? rows.map((r) => ({
                      id: r.id,
                      user_name: r.user_name,
                      role: r.role,
                      panjang_password: r.password ? String(r.password).length : 0
                  }))
                : rows
        };

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                step: "SUPABASE_QUERY",
                error: "Gagal membaca tabel user di Supabase",
                diag
            });
        }

        if (Array.isArray(rows) && rows.length === 0) {
            return res.status(200).json({
                success: false,
                step: "RLS_OR_EMPTY_TABLE",
                error: "Koneksi ke Supabase berhasil, tapi 0 baris terbaca. Kemungkinan besar Row Level Security (RLS) di tabel 'user' masih aktif atau tabel masih kosong.",
                diag
            });
        }

        // 2. Kalau request POST, sekalian tes pencocokan input login
        if (req.method === "POST") {
            const body =
                typeof req.body === "string"
                    ? JSON.parse(req.body || "{}")
                    : req.body || {};

            const cleanInput = String(body.id || "").trim();
            const cleanPass = String(body.password || "").trim();

            const userCandidates = rows.filter(
                (u) =>
                    String(u.id) === cleanInput ||
                    String(u.user_name || "").toLowerCase() === cleanInput.toLowerCase()
            );

            const matchedUser = userCandidates.find(
                (u) => String(u.password || "").trim() === cleanPass
            );

            diag.login_check = {
                input_id: cleanInput,
                kandidat_akun_ketemu: userCandidates.length,
                password_cocok: Boolean(matchedUser),
                akun_cocok: matchedUser
                    ? {
                          id: matchedUser.id,
                          user_name: matchedUser.user_name,
                          role: matchedUser.role
                      }
                    : null
            };

            if (!userCandidates.length) {
                return res.status(401).json({
                    success: false,
                    step: "USER_NOT_FOUND",
                    error: `ID atau user_name "${cleanInput}" tidak cocok dengan baris mana pun di tabel user`,
                    diag
                });
            }

            if (!matchedUser) {
                return res.status(401).json({
                    success: false,
                    step: "WRONG_PASSWORD",
                    error: `Akun "${cleanInput}" ketemu, tapi password tidak cocok`,
                    diag
                });
            }

            return res.status(200).json({
                success: true,
                step: "OK",
                message: "Kredensial valid dan siap dipakai login!",
                diag
            });
        }

        return res.status(200).json({
            success: true,
            step: "GET_DIAGNOSTIC",
            diag
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            step: "SERVER_EXCEPTION",
            error: err.message,
            stack: err.stack,
            diag
        });
    }
}
