import crypto from "crypto";

const COOKIE_NAME = "golddash_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
    const secret = process.env.AUTH_SECRET || process.env.SUPABASE_KEY;
    if (!secret) {
        throw new Error("AUTH_SECRET belum diatur di Environment Variables");
    }
    return secret;
}

function safeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function checkPassword(inputPassword, storedPassword) {
    if (!storedPassword) return false;
    const stored = String(storedPassword).trim();

    if (stored.startsWith("sha256:")) {
        const hash = crypto
            .createHash("sha256")
            .update(String(inputPassword))
            .digest("hex");
        return safeEqual(`sha256:${hash}`, stored);
    }

    return safeEqual(String(inputPassword).trim(), stored);
}

export async function verifyCredentials(loginInput, password) {
    if (!process.env.SUPABASE_KEY) {
        throw new Error("Environment variable SUPABASE_KEY belum diatur");
    }

    const supabaseUrl =
        process.env.SUPABASE_URL || "https://zasjkgrmcvigblpyqsff.supabase.co";

    const cleanInput = String(loginInput).trim();
    const isNumericId = /^\d+$/.test(cleanInput);

    const filter = isNumericId
        ? `or=(id.eq.${cleanInput},user_name.ilike.${encodeURIComponent(cleanInput)})`
        : `user_name.ilike.${encodeURIComponent(cleanInput)}`;

    // Tanpa limit=1 agar tetap bisa mencocokkan jika ada user_name yang sama
    const url = `${supabaseUrl}/rest/v1/user?${filter}&select=id,user_name,password,role&order=id.asc`;

    const response = await fetch(url, {
        headers: {
            apikey: process.env.SUPABASE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_KEY}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Supabase error (${response.status}): ${JSON.stringify(data)}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("ID atau username tidak ditemukan di database");
    }

    const matchedUser = data.find((u) => checkPassword(password, u.password));
    if (!matchedUser) {
        throw new Error("Password yang Anda masukkan salah");
    }

    return {
        id: matchedUser.id,
        user_name: matchedUser.user_name || String(matchedUser.id),
        role: matchedUser.role || "viewer"
    };
}

export function createSessionToken(user) {
    const payload = Buffer.from(
        JSON.stringify({
            sub: user.id,
            name: user.user_name,
            role: user.role || "viewer",
            exp: Date.now() + SESSION_MAX_AGE * 1000
        })
    ).toString("base64url");

    const signature = crypto
        .createHmac("sha256", getSecret())
        .update(payload)
        .digest("base64url");

    return `${payload}.${signature}`;
}

export function verifySessionToken(token) {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expectedSig = crypto
        .createHmac("sha256", getSecret())
        .update(payload)
        .digest("base64url");

    if (!safeEqual(signature, expectedSig)) return null;

    try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (!data.exp || Date.now() > data.exp) return null;
        return data;
    } catch {
        return null;
    }
}

export function parseCookies(req) {
    const header = req.headers?.cookie || "";
    const cookies = {};

    header.split(";").forEach((part) => {
        const idx = part.indexOf("=");
        if (idx > -1) {
            const key = part.slice(0, idx).trim();
            const val = part.slice(idx + 1).trim();
            cookies[key] = decodeURIComponent(val);
        }
    });

    return cookies;
}

export function getSessionUser(req) {
    const cookies = parseCookies(req);
    return verifySessionToken(cookies[COOKIE_NAME]);
}

export function requireAuth(req, res) {
    const user = getSessionUser(req);
    if (!user) {
        res.status(401).json({
            success: false,
            error: "Unauthorized",
            message: "Sesi habis atau belum login"
        });
        return null;
    }
    return user;
}

export function requireAdmin(req, res) {
    const user = requireAuth(req, res);
    if (!user) return null;

    if (user.role !== "admin") {
        res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Akun Anda tidak memiliki akses ke fitur investasi"
        });
        return null;
    }
    return user;
}

export function setSessionCookie(res, token) {
    const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
    const cookieParts = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Max-Age=${SESSION_MAX_AGE}`
    ];

    if (isProd) cookieParts.push("Secure");
    res.setHeader("Set-Cookie", cookieParts.join("; "));
}

export function clearSessionCookie(res) {
    const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
    const cookieParts = [
        `${COOKIE_NAME}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0"
    ];

    if (isProd) cookieParts.push("Secure");
    res.setHeader("Set-Cookie", cookieParts.join("; "));
}
