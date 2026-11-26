import {
    verifyCredentials,
    createSessionToken,
    setSessionCookie
} from "./lib/auth.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        const body =
            typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

        const id = String(body.id || "").trim();
        const password = String(body.password || "");

        if (!id || !password) {
            return res.status(400).json({
                success: false,
                message: "ID dan password wajib diisi"
            });
        }

        const user = await verifyCredentials(id, password);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "ID atau password yang Anda masukkan salah!"
            });
        }

        const token = createSessionToken(user);
        setSessionCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "Login berhasil",
            user
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Terjadi kesalahan pada server"
        });
    }
}
