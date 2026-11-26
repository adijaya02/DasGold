document.documentElement.style.visibility = "hidden";

function applyRolePermissions(role) {
    if (role !== "admin") {
        // Hapus menu Investasi dari sidebar
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

        // Blokir akses langsung ke halaman investasi jika bukan admin
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

async function handleLogout(e) {
    if (e) e.preventDefault();
    try {
        await fetch("/api/logout", {
            method: "POST",
            credentials: "same-origin"
        });
    } catch (err) {
        console.error(err);
    } finally {
        window.location.replace("login.html");
    }
}

window.logout = handleLogout;

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".logout-btn");
    if (btn) {
        handleLogout(e);
    }
});
