(function () {
    const main = document.querySelector(".admin-container");
    if (!main) return;

    async function request(action, options) {
        const settings = options || {};
        let response;
        try {
            response = await fetch("api/admin.php?action=" + encodeURIComponent(action), {
                method: settings.method || "GET",
                credentials: "same-origin",
                headers: settings.body ? { "Content-Type": "application/json" } : {},
                body: settings.body ? JSON.stringify(settings.body) : undefined
            });
        } catch (error) {
            throw new Error("Could not reach the server. Make sure Apache and MySQL are running.");
        }
        let result;
        try {
            result = await response.json();
        } catch (error) {
            throw new Error("The server returned an invalid response.");
        }
        if (!response.ok || result.success !== true) {
            const failure = new Error(result.message || "The request could not be completed.");
            failure.status = response.status;
            throw failure;
        }
        return result;
    }

    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined && text !== null) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function showMessage(text, isError) {
        const message = document.getElementById("adminMessage");
        if (!message) return;
        message.textContent = text;
        message.classList.toggle("error", Boolean(isError));
    }

    function formatMoney(value) {
        return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function drawEmpty(container, text) {
        container.replaceChildren(element("p", text, "empty-note"));
    }

    async function loadSummary() {
        const { summary } = await request("summary");
        document.getElementById("todayRevenue").textContent = formatMoney(summary.today_revenue);
        document.getElementById("todayOrders").textContent = summary.today_orders;
        document.getElementById("pendingKitchen").textContent = summary.pending_kitchen + " orders in kitchen";
        document.getElementById("occupiedTables").textContent = summary.occupied_tables + " / " + summary.table_count;
        document.getElementById("staffOnShift").textContent = summary.staff_on_shift;
    }

    async function loadStaff() {
        const { staff } = await request("staff");
        const rows = document.getElementById("staffRows");
        rows.replaceChildren();
        if (!staff.length) {
            const row = element("tr");
            const cell = element("td", "No staff accounts yet.");
            cell.colSpan = 4;
            row.appendChild(cell);
            rows.appendChild(row);
            return;
        }
        staff.forEach(function (person) {
            const row = element("tr");
            row.append(
                element("td", person.name),
                element("td", person.role.charAt(0).toUpperCase() + person.role.slice(1)),
                element("td", person.shift_started || "—"),
                element("td", person.shift_started ? "On duty" : "Off duty")
            );
            rows.appendChild(row);
        });
    }

    async function loadMenuApprovals() {
        const { items } = await request("menu");
        const container = document.getElementById("menuApprovals");
        container.replaceChildren();
        if (!items.length) return drawEmpty(container, "No menu items awaiting approval.");
        items.forEach(function (item) {
            const card = element("div", undefined, "approval-item");
            const details = element("div", undefined, "item-details");
            details.append(element("h4", item.name), element("p", (item.category || "Uncategorized") + " · Proposed by " + (item.chef_name || "chef")));
            const price = document.createElement("input");
            price.type = "number";
            price.min = "0.01";
            price.step = "0.01";
            price.value = Number(item.price) > 0 ? Number(item.price).toFixed(2) : "";
            price.placeholder = "Approved price";
            price.setAttribute("aria-label", "Approved price for " + item.name);
            const actions = element("div", undefined, "item-actions");
            const approve = element("button", "Approve", "btn-approve");
            approve.type = "button";
            approve.addEventListener("click", async function () {
                try {
                    await request("menu", { method: "POST", body: { item_id: Number(item.id), decision: "approve", price: Number(price.value) } });
                    showMessage("Menu item approved.", false);
                    await loadMenuApprovals();
                } catch (error) { showMessage(error.message, true); }
            });
            const reject = element("button", "Reject", "btn-reject");
            reject.type = "button";
            reject.addEventListener("click", async function () {
                try {
                    await request("menu", { method: "POST", body: { item_id: Number(item.id), decision: "reject" } });
                    showMessage("Menu item rejected.", false);
                    await loadMenuApprovals();
                } catch (error) { showMessage(error.message, true); }
            });
            actions.append(price, approve, reject);
            card.append(details, actions);
            container.appendChild(card);
        });
    }

    async function loadCustomers() {
        const { customers } = await request("customers");
        const container = document.getElementById("customerApprovals");
        container.replaceChildren();
        if (!customers.length) return drawEmpty(container, "No customer accounts awaiting approval.");
        customers.forEach(function (customer) {
            const card = element("div", undefined, "approval-item");
            const details = element("div", undefined, "item-details");
            details.append(element("h4", customer.name), element("p", customer.email));
            const approve = element("button", "Approve", "btn-approve");
            approve.type = "button";
            approve.addEventListener("click", async function () {
                try {
                    await request("customers", { method: "POST", body: { customer_id: Number(customer.id) } });
                    showMessage("Customer account approved.", false);
                    await loadCustomers();
                } catch (error) { showMessage(error.message, true); }
            });
            card.append(details, approve);
            container.appendChild(card);
        });
    }

    async function loadReservations() {
        const { reservations } = await request("reservations");
        const container = document.getElementById("reservationList");
        container.replaceChildren();
        if (!reservations.length) return drawEmpty(container, "No reservations.");
        reservations.forEach(function (reservation) {
            const card = element("div", undefined, "approval-item");
            const details = element("div", undefined, "item-details");
            details.append(
                element("h4", reservation.customer_name + " · Table " + reservation.table_number),
                element("p", reservation.reservation_date + " " + reservation.reservation_time + " · " + reservation.guests + " guests · " + reservation.status)
            );
            const actions = element("div", undefined, "item-actions");
            if (reservation.status === "pending") {
                actions.appendChild(reservationAction(reservation.id, "confirmed", "Confirm"));
            }
            if (reservation.status === "pending" || reservation.status === "confirmed") {
                actions.appendChild(reservationAction(reservation.id, "cancelled", "Cancel"));
                if (reservation.status === "confirmed") actions.appendChild(reservationAction(reservation.id, "completed", "Complete"));
            }
            card.append(details, actions);
            container.appendChild(card);
        });
    }

    function reservationAction(id, status, label) {
        const button = element("button", label, "btn-action");
        button.type = "button";
        button.addEventListener("click", async function () {
            try {
                await request("reservations", { method: "POST", body: { reservation_id: Number(id), status: status } });
                showMessage("Reservation updated.", false);
                await loadReservations();
            } catch (error) { showMessage(error.message, true); }
        });
        return button;
    }

    async function loadReviews() {
        const { reviews } = await request("reviews");
        const container = document.getElementById("reviewApprovals");
        container.replaceChildren();
        if (!reviews.length) return drawEmpty(container, "No reviews awaiting moderation.");
        reviews.forEach(function (review) {
            const card = element("div", undefined, "approval-item");
            const details = element("div", undefined, "item-details");
            details.append(
                element("h4", review.name + " · " + "★".repeat(Number(review.rating))),
                element("p", review.category + " · " + review.comment)
            );
            const actions = element("div", undefined, "item-actions");
            ["approve", "reject"].forEach(function (decision) {
                const button = element("button", decision === "approve" ? "Approve" : "Reject", decision === "approve" ? "btn-approve" : "btn-reject");
                button.type = "button";
                button.addEventListener("click", async function () {
                    try {
                        await request("reviews", { method: "POST", body: { review_id: Number(review.id), decision: decision } });
                        showMessage("Review " + decision + "d.", false);
                        await loadReviews();
                    } catch (error) { showMessage(error.message, true); }
                });
                actions.appendChild(button);
            });
            card.append(details, actions);
            container.appendChild(card);
        });
    }

    function renderLogin() {
        main.replaceChildren();
        const card = element("section", undefined, "panel-card");
        card.style.maxWidth = "460px";
        card.style.margin = "60px auto";
        card.append(element("h1", "Administrator Sign In"), element("p", "Sign in with an approved admin account to manage the restaurant."));
        const form = document.createElement("form");
        form.className = "admin-form";
        const email = document.createElement("input");
        email.type = "email";
        email.name = "email";
        email.placeholder = "Administrator email";
        email.required = true;
        const password = document.createElement("input");
        password.type = "password";
        password.name = "password";
        password.placeholder = "Password";
        password.required = true;
        const button = element("button", "Sign In", "btn-sm-primary");
        button.type = "submit";
        const message = element("p");
        message.setAttribute("role", "status");
        form.append(email, password, button);
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            try {
                const result = await request("login", { method: "POST", body: { email: email.value, password: password.value } });
                window.location.reload();
            } catch (error) {
                message.textContent = error.message;
                message.className = "admin-feedback error";
            }
        });
        card.append(form, message);
        main.appendChild(card);
    }

    async function start() {
        try {
            const { admin } = await request("me");
            const identity = document.getElementById("adminIdentity");
            if (identity) identity.textContent = admin.name;
            const avatar = document.getElementById("adminAvatar");
            if (avatar) {
                avatar.textContent = admin.name.trim().charAt(0).toUpperCase();
                avatar.title = admin.name;
            }
            const logout = document.getElementById("adminLogout");
            if (logout) logout.addEventListener("click", async function () {
                try {
                    await request("logout", { method: "POST", body: {} });
                    window.location.href = "index.html";
                } catch (error) { showMessage(error.message, true); }
            });
            const toggle = document.getElementById("toggleStaffForm");
            const staffForm = document.getElementById("staffForm");
            if (toggle && staffForm) toggle.addEventListener("click", function () { staffForm.hidden = !staffForm.hidden; });
            if (staffForm) staffForm.addEventListener("submit", async function (event) {
                event.preventDefault();
                try {
                    await request("staff", { method: "POST", body: Object.fromEntries(new FormData(staffForm)) });
                    staffForm.reset();
                    staffForm.hidden = true;
                    showMessage("Staff account created.", false);
                    await loadStaff();
                } catch (error) { showMessage(error.message, true); }
            });
            await Promise.all([loadSummary(), loadStaff(), loadMenuApprovals(), loadCustomers(), loadReservations(), loadReviews()]);
        } catch (error) {
            if (error.status === 401) renderLogin();
            else showMessage(error.message, true);
        }
    }

    start();
}());
