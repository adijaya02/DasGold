import { getSessionUser } from "./lib/auth.js";

export default function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const user = getSessionUser(req);

    if (!user) {
        return res.status(401).json({
            authenticated: false
        });
    }

    return res.status(200).json({
        authenticated: true,
        user: user.sub,
        name: user.name,
        role: user.role || "viewer"
    });
}
