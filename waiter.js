document.addEventListener("DOMContentLoaded", function () {
    const clockToggle = document.getElementById("clockToggle");
    const clockDot = document.getElementById("clockDot");
    const clockLabel = document.getElementById("clockLabel");
    const shiftTime = document.getElementById("shiftTime");
    const orderList = document.getElementById("ordersList");

    function showError(error) {
        window.alert(error.message);
    }

    function renderClock(shift) {
        const clockedIn = Boolean(shift);
        clockDot.classList.toggle("on", clockedIn);
        clockLabel.textContent = clockedIn ? "Clocked In" : "Clocked Out";
        shiftTime.textContent = shift ? "On shift since " + new Date(shift.clock_in.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not currently on shift";
        clockToggle.textContent = clockedIn ? "Clock Out" : "Clock In";
        clockToggle.classList.toggle("btn-clock-in", !clockedIn);
        clockToggle.classList.toggle("btn-clock-out", clockedIn);
        clockToggle.dataset.mode = clockedIn ? "out" : "in";
    }

    function refreshTableSelect() {
        const select = document.getElementById("orderTable");
        if (!select) return;
        select.replaceChildren();
        const ownTables = document.querySelectorAll("#tableGrid .table-card.mine");
        if (!ownTables.length) {
            const option = new Option("No tables assigned yet", "");
            option.disabled = true;
            option.selected = true;
            select.appendChild(option);
            return;
        }
        ownTables.forEach(function (card) {
            select.appendChild(new Option(card.dataset.table, card.dataset.tableId));
        });
    }

    async function loadTables() {
        const result = await window.rmsRequest("waiter_tables");
        const currentUser = await window.rmsRequest("me");
        result.tables.forEach(function (table) {
            const card = Array.from(document.querySelectorAll("#tableGrid .table-card")).find(function (candidate) {
                return candidate.dataset.table === table.table_number;
            });
            if (!card) return;
            card.dataset.tableId = table.id;
            card.classList.remove("available", "mine", "occupied");
            let label = "Available";
            if (table.waiter_id) {
                if (Number(table.waiter_id) === Number(currentUser.user.id)) {
                    card.classList.add("mine");
                    label = "Your Table";
                } else {
                    card.classList.add("occupied");
                    label = "Taken";
                }
            } else if (table.status === "occupied") {
                card.classList.add("occupied");
                label = "Occupied";
            } else {
                card.classList.add("available");
            }
            const status = card.querySelector(".table-status");
            status.textContent = label;
            status.className = "table-status" + (label === "Available" ? " available-status" : label === "Taken" || label === "Occupied" ? " occupied-status" : "");
        });
        refreshTableSelect();
    }

    async function loadOrders() {
        const result = await window.rmsRequest("waiter_orders");
        orderList.replaceChildren();
        if (!result.orders.length) {
            orderList.appendChild(Object.assign(document.createElement("p"), { className: "empty-note", textContent: "No orders for your tables yet." }));
            return;
        }
        const steps = ["Placed", "In Kitchen", "Ready", "Delivered", "Paid"];
        result.orders.forEach(function (order) {
            const card = document.createElement("div");
            card.className = "order-card";
            card.dataset.order = order.id;
            const top = document.createElement("div");
            top.className = "order-top";
            const summary = document.createElement("span");
            const tableTag = document.createElement("span");
            tableTag.className = "order-table-tag";
            tableTag.textContent = order.table_number || "Pre-order";
            summary.append(tableTag, document.createTextNode(" "));
            const orderTitle = document.createElement("b");
            orderTitle.textContent = "Order #" + order.id;
            summary.append(orderTitle, document.createElement("br"));
            const timestamp = document.createElement("span");
            timestamp.className = "small";
            timestamp.textContent = order.customer_name + " · " + new Date(order.created_at.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            summary.appendChild(timestamp);
            const visibleStatus = order.status === "Served" ? "Delivered" : order.status;
            const badge = document.createElement("span");
            badge.className = "status " + (visibleStatus === "Paid" || visibleStatus === "Delivered" ? "status-open" : "status-blue");
            badge.textContent = visibleStatus;
            top.append(summary, badge);
            card.append(top);
            const items = document.createElement("div");
            items.className = "food-desc";
            items.textContent = order.item_summary || "";
            card.appendChild(items);
            const progress = document.createElement("div");
            progress.className = "progress";
            const stepIndex = order.status === "Served" ? 3 : steps.indexOf(order.status);
            steps.slice(0, 4).forEach(function (step, index) {
                const stepElement = document.createElement("div");
                stepElement.className = "step" + (index < stepIndex ? " done" : index === stepIndex ? " active" : "");
                stepElement.textContent = step;
                progress.appendChild(stepElement);
            });
            card.appendChild(progress);
            if (order.status === "Ready") {
                const actions = document.createElement("div");
                actions.className = "order-actions";
                const deliver = document.createElement("button");
                deliver.type = "button";
                deliver.className = "btn2 mark-delivered";
                deliver.dataset.orderId = order.id;
                deliver.textContent = "Mark Delivered";
                actions.appendChild(deliver);
                card.appendChild(actions);
            }
            orderList.appendChild(card);
        });
    }

    if (clockToggle) {
        window.rmsRequest("waiter_clock").then(function (result) {
            renderClock(result.shift);
        }).catch(showError);
        clockToggle.addEventListener("click", async function () {
            try {
                const result = await window.rmsRequest("waiter_clock", { method: "POST", body: { mode: clockToggle.dataset.mode } });
                renderClock(result.shift);
                await loadTables();
            } catch (error) {
                showError(error);
            }
        });
    }

    const tableGrid = document.getElementById("tableGrid");
    if (tableGrid) {
        loadTables().catch(showError);
        tableGrid.addEventListener("click", async function (event) {
            const card = event.target.closest(".table-card");
            if (!card || !card.dataset.tableId || card.classList.contains("occupied")) return;
            try {
                await window.rmsRequest("waiter_tables", {
                    method: "POST",
                    body: { table_id: Number(card.dataset.tableId), mode: card.classList.contains("mine") ? "release" : "take" }
                });
                await loadTables();
            } catch (error) {
                showError(error);
            }
        });
    }

    document.querySelectorAll("[data-modal]").forEach(function (button) {
        button.addEventListener("click", function () {
            const modal = document.getElementById(button.dataset.modal);
            if (modal) {
                refreshTableSelect();
                modal.classList.add("show");
            }
        });
    });
    document.querySelectorAll(".modal-close").forEach(function (button) {
        button.addEventListener("click", function () { button.closest(".modal").classList.remove("show"); });
    });

    const menuPickList = document.getElementById("menuPickList");
    if (menuPickList) {
        window.rmsRequest("menu").then(function (result) {
            menuPickList.replaceChildren();
            result.items.forEach(function (item) {
                const row = document.createElement("div");
                row.className = "item-pick";
                row.dataset.item = item.name;
                const label = document.createElement("span");
                label.className = "item-label";
                const name = document.createElement("b");
                name.textContent = item.name;
                const price = document.createElement("span");
                price.textContent = Number(item.price).toFixed(2).replace(/\.00$/, "") + " Tk";
                label.append(name, price);
                const quantity = document.createElement("span");
                quantity.className = "qty-control";
                const minus = document.createElement("button");
                minus.type = "button";
                minus.className = "qty-btn qty-minus";
                minus.textContent = "−";
                const value = document.createElement("span");
                value.className = "qty-value";
                value.textContent = "0";
                const plus = document.createElement("button");
                plus.type = "button";
                plus.className = "qty-btn qty-plus";
                plus.textContent = "+";
                quantity.append(minus, value, plus);
                row.append(label, quantity);
                menuPickList.appendChild(row);
            });
        }).catch(showError);
        menuPickList.addEventListener("click", function (event) {
            const button = event.target.closest(".qty-plus, .qty-minus");
            if (!button) return;
            const value = button.closest(".item-pick").querySelector(".qty-value");
            const quantity = Number(value.textContent);
            value.textContent = String(button.classList.contains("qty-plus") ? quantity + 1 : Math.max(0, quantity - 1));
        });
    }

    const addOrderForm = document.getElementById("addOrderForm");
    if (addOrderForm) {
        addOrderForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const items = Array.from(document.querySelectorAll("#menuPickList .item-pick")).map(function (row) {
                return { name: row.dataset.item, quantity: Number(row.querySelector(".qty-value").textContent) };
            }).filter(function (item) { return item.quantity > 0; });
            const tableSelect = document.getElementById("orderTable");
            if (!tableSelect.value || !items.length) {
                window.alert("Take a table and select at least one item.");
                return;
            }
            try {
                await window.rmsRequest("waiter_orders", {
                    method: "POST",
                    body: {
                        table_id: Number(tableSelect.value),
                        customer_name: document.getElementById("orderCustomer").value.trim(),
                        notes: document.getElementById("orderNotes").value,
                        items: items
                    }
                });
                addOrderForm.reset();
                document.querySelectorAll("#menuPickList .qty-value").forEach(function (value) { value.textContent = "0"; });
                document.getElementById("addOrderModal").classList.remove("show");
                await loadOrders();
            } catch (error) {
                showError(error);
            }
        });
    }

    if (orderList) {
        loadOrders().catch(showError);
        orderList.addEventListener("click", async function (event) {
            const button = event.target.closest(".mark-delivered");
            if (!button) return;
            try {
                await window.rmsRequest("waiter_deliver", { method: "POST", body: { order_id: Number(button.dataset.orderId) } });
                await loadOrders();
            } catch (error) {
                showError(error);
            }
        });
    }

    document.querySelectorAll('a[href="index.html"]').forEach(function (link) {
        if (!link.textContent.trim().toLowerCase().includes("logout")) return;
        link.addEventListener("click", function (event) {
            event.preventDefault();
            window.rmsRequest("logout", { method: "POST" }).finally(function () { window.location.href = "index.html"; });
        });
    });
});
