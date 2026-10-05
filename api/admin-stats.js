(function () {
    async function request(action, options) {
        const settings = options || {};
        const response = await fetch("api/admin.php?action=" + encodeURIComponent(action), {
            method: settings.method || "GET",
            credentials: "same-origin",
            headers: settings.body ? { "Content-Type": "application/json" } : {},
            body: settings.body ? JSON.stringify(settings.body) : undefined
        });
        const result = await response.json();
        if (!response.ok || result.success !== true) {
            const error = new Error(result.message || "The request could not be completed.");
            error.status = response.status;
            throw error;
        }
        return result;
    }

    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function errorPanel(container, message) {
        container.replaceChildren(element("p", message));
    }

    function renderCategorySales(rows) {
        const chart = document.getElementById("categoryChart");
        const legend = document.getElementById("categoryLegend");
        const total = rows.reduce(function (sum, row) { return sum + Number(row.revenue); }, 0);
        if (!total) {
            chart.style.background = "#E2E8F0";
            legend.replaceChildren(element("span", "No paid sales in the last 30 days."));
            return;
        }
        const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f7d794", "#805ad5", "#38a169"];
        let current = 0;
        const slices = [];
        legend.replaceChildren();
        rows.forEach(function (row, index) {
            const percentage = Number(row.revenue) / total * 100;
            const next = current + percentage;
            slices.push(colors[index % colors.length] + " " + current.toFixed(2) + "% " + next.toFixed(2) + "%");
            current = next;
            const item = element("div", undefined, "legend-item");
            const color = element("span", undefined, "legend-color");
            color.style.backgroundColor = colors[index % colors.length];
            item.append(color, document.createTextNode(row.category + " (" + percentage.toFixed(1) + "%)"));
            legend.appendChild(item);
        });
        chart.style.background = "conic-gradient(" + slices.join(", ") + ")";
    }

    function renderWeeklyRevenue(rows) {
        const chart = document.getElementById("weeklyChart");
        const byDay = new Map(rows.map(function (row) { return [row.day, Number(row.revenue)]; }));
        const days = [];
        const today = new Date();
        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - offset);
            const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
            days.push({ date: date, revenue: byDay.get(key) || 0 });
        }
        const peak = Math.max.apply(null, days.map(function (day) { return day.revenue; }));
        chart.replaceChildren();
        days.forEach(function (day) {
            const row = element("div", undefined, "bar-row");
            row.appendChild(element("div", day.date.toLocaleDateString(undefined, { weekday: "short" }), "bar-label"));
            const track = element("div", undefined, "bar-track");
            const fill = element("div", undefined, "bar-fill");
            fill.style.width = peak ? (day.revenue / peak * 100) + "%" : "0%";
            track.appendChild(fill);
            row.append(track, element("div", Number(day.revenue).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " Tk", "val"));
            chart.appendChild(row);
        });
    }

    async function start() {
        const chart = document.getElementById("categoryChart");
        const legend = document.getElementById("categoryLegend");
        const weekly = document.getElementById("weeklyChart");
        try {
            const { admin } = await request("me");
            const name = document.getElementById("adminStatsName");
            const avatar = document.getElementById("adminStatsAvatar");
            if (name) name.textContent = admin.name;
            if (avatar) {
                avatar.textContent = admin.name.trim().charAt(0).toUpperCase();
                avatar.title = admin.name;
            }
            const result = await request("stats");
            renderCategorySales(result.category_sales);
            renderWeeklyRevenue(result.weekly_revenue);
            const logout = document.getElementById("adminStatsLogout");
            logout.addEventListener("click", async function () {
                try {
                    await request("logout", { method: "POST", body: {} });
                    window.location.href = "admin.html";
                } catch (error) {
                    errorPanel(legend, error.message);
                }
            });
        } catch (error) {
            if (error.status === 401) {
                window.location.href = "admin.html";
                return;
            }
            errorPanel(chart.parentElement, error.message);
            errorPanel(weekly, error.message);
        }
    }

    start();
}());
