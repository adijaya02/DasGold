const SESSION_CACHE_KEY = "golddash_session_cache";
const SESSION_CACHE_TTL = 5 * 60 * 1000;

function getCachedSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.role || Date.now() - parsed.ts > SESSION_CACHE_TTL) {
            sessionStorage.removeItem(SESSION_CACHE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function setCachedSession(role) {
    try {
        sessionStorage.setItem(
            SESSION_CACHE_KEY,
            JSON.stringify({ role: role || "viewer", ts: Date.now() })
        );
    } catch {}
}

function clearCachedSession() {
    try {
        sessionStorage.removeItem(SESSION_CACHE_KEY);
    } catch {}
}

function applyRolePermissions(role) {
    if (role !== "admin") {
        document.querySelectorAll('.menu a[href*="investasi"]').forEach((link) => {
            const listItem = link.closest("li");
            if (listItem) {
                listItem.remove();
            } else {
                link.remove();
            }
        });
    }
}

function onDomReady(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
    } else {
        callback();
    }
}

(async function checkUserSession() {
    const currentPath = window.location.pathname.toLowerCase();
    const cached = getCachedSession();

    if (cached) {
        if (cached.role !== "admin" && currentPath.includes("investasi")) {
            window.location.replace("dashboard.html");
            return;
        }
        onDomReady(() => applyRolePermissions(cached.role));
    } else {
        document.documentElement.style.visibility = "hidden";
    }

    try {
        const res = await fetch(`/api/check-auth?t=${Date.now()}`, {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!res.ok) {
            clearCachedSession();
            window.location.replace("login.html");
            return;
        }

        const data = await res.json();
        const role = data.role || "viewer";
        setCachedSession(role);

        if (role !== "admin" && currentPath.includes("investasi")) {
            window.location.replace("dashboard.html");
            return;
        }

        onDomReady(() => {
            applyRolePermissions(role);
            document.documentElement.style.visibility = "visible";
        });
    } catch (err) {
        console.error("Auth check failed:", err);
        if (!cached) {
            clearCachedSession();
            window.location.replace("login.html");
        }
    }
})();

let isLoggingOut = false;

async function handleLogout(e) {
    if (e) e.preventDefault();
    if (isLoggingOut) return;
    isLoggingOut = true;

    clearCachedSession();

    const overlay = document.createElement("div");
    overlay.style.cssText =
        "position:fixed;inset:0;background:#04264a;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Poppins,sans-serif;font-size:15px;z-index:99999;opacity:0;transition:opacity .15s ease;";
    overlay.textContent = "Keluar dari akun...";
    document.body.appendChild(overlay);
    requestAnimationFrame(() => (overlay.style.opacity = "1"));

    try {
        sessionStorage.setItem("just_logged_out", "1");
        await fetch("/api/logout", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store"
        });
    } catch (err) {
        console.error("Logout error:", err);
    } finally {
        window.location.replace("login.html?logout=1");
    }
}

window.logout = handleLogout;

document.addEventListener("click", (e) => {
    const target = e.target.closest("a, button, [data-logout], .logout-btn, .logout");
    if (!target) return;

    const href = (target.getAttribute("href") || "").toLowerCase();
    const text = (target.textContent || "").trim().toLowerCase();
    const isLogoutTrigger =
        target.matches(".logout-btn, .logout, [data-logout]") ||
        href.includes("login.html") ||
        text === "logout" ||
        text === "keluar";

    if (isLogoutTrigger) {
        handleLogout(e);
    }
});
