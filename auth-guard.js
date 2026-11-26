document.documentElement.style.visibility = "hidden";

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

(async function checkUserSession() {
    try {
        const res = await fetch("/api/check-auth", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!res.ok) {
            window.location.replace("login.html");
            return;
        }

        const data = await res.json();
        const role = data.role || "viewer";
        const currentPath = window.location.pathname.toLowerCase();

        if (role !== "admin" && currentPath.includes("investasi")) {
            window.location.replace("dashboard.html");
            return;
        }

        const revealPage = () => {
            applyRolePermissions(role);
            document.documentElement.style.visibility = "visible";
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", revealPage);
        } else {
            revealPage();
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        window.location.replace("login.html");
    }
})();

let isLoggingOut = false;

async function handleLogout(e) {
    if (e) e.preventDefault();
    if (isLoggingOut) return;
    isLoggingOut = true;

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
