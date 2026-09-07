document.addEventListener("DOMContentLoaded", function () {

    /* ---------- Clock In / Out ---------- */
    const clockToggle = document.getElementById("clockToggle");
    const clockDot = document.getElementById("clockDot");
    const clockLabel = document.getElementById("clockLabel");
    const shiftTime = document.getElementById("shiftTime");
    let clockedIn = false;

    if (clockToggle) {
        clockToggle.addEventListener("click", function () {
            clockedIn = !clockedIn;
            const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            if (clockedIn) {
                clockDot.classList.add("on");
                clockLabel.textContent = "Clocked In";
                shiftTime.textContent = "On shift since " + now;
                clockToggle.textContent = "Clock Out";
                clockToggle.classList.remove("btn-clock-in");
                clockToggle.classList.add("btn-clock-out");
            } else {
                clockDot.classList.remove("on");
                clockLabel.textContent = "Clocked Out";
                shiftTime.textContent = "Shift ended at " + now;
                clockToggle.textContent = "Clock In";
                clockToggle.classList.remove("btn-clock-out");
                clockToggle.classList.add("btn-clock-in");
            }
        });
    }

    /* ---------- Take up / release tables ---------- */
    function refreshTableSelect() {
        const select = document.getElementById("orderTable");
        if (!select) return;
        const myTables = document.querySelectorAll("#tableGrid .table-card.mine");
        select.innerHTML = "";
        if (myTables.length === 0) {
            const opt = document.createElement("option");
            opt.textContent = "No tables assigned yet";
            opt.disabled = true;
            opt.selected = true;
            select.appendChild(opt);
            return;
        }
        myTables.forEach(function (card) {
            const opt = document.createElement("option");
            opt.value = card.dataset.table;
            opt.textContent = card.dataset.table;
            select.appendChild(opt);
        });
    }

    document.querySelectorAll("#tableGrid .table-card").forEach(function (card) {
        if (card.classList.contains("occupied")) return;

        card.addEventListener("click", function () {
            if (card.classList.contains("available")) {
                card.classList.remove("available");
                card.classList.add("mine");
                card.querySelector(".table-status").textContent = "Your Table";
                card.querySelector(".table-status").className = "table-status";
            } else if (card.classList.contains("mine")) {
                card.classList.remove("mine");
                card.classList.add("available");
                card.querySelector(".table-status").textContent = "Available";
                card.querySelector(".table-status").className = "table-status available-status";
            }
            refreshTableSelect();
        });
    });

    /* ---------- Modal open/close ---------- */
    document.querySelectorAll("[data-modal]").forEach(function (button) {
        button.addEventListener("click", function () {
            const modal = document.getElementById(button.dataset.modal);
            if (!modal) return;
            if (modal.id === "addOrderModal") refreshTableSelect();
            modal.classList.add("show");
        });
    });
    document.querySelectorAll(".modal-close").forEach(function (button) {
        button.addEventListener("click", function () {
            button.closest(".modal").classList.remove("show");
        });
    });

    /* ---------- Quantity steppers inside Add Order modal ---------- */
    document.querySelectorAll("#menuPickList .item-pick").forEach(function (row) {
        const valueEl = row.querySelector(".qty-value");
        row.querySelector(".qty-plus").addEventListener("click", function () {
            valueEl.textContent = parseInt(valueEl.textContent, 10) + 1;
        });
        row.querySelector(".qty-minus").addEventListener("click", function () {
            const current = parseInt(valueEl.textContent, 10);
            if (current > 0) valueEl.textContent = current - 1;
        });
    });

    /* ---------- Add Order submit ---------- */
    let orderCounter = 1025;
    const addOrderForm = document.getElementById("addOrderForm");
    if (addOrderForm) {
        addOrderForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const table = document.getElementById("orderTable").value;
            const customer = document.getElementById("orderCustomer").value.trim() || "Walk-in";

            const picked = [];
            document.querySelectorAll("#menuPickList .item-pick").forEach(function (row) {
                const qty = parseInt(row.querySelector(".qty-value").textContent, 10);
                if (qty > 0) picked.push(row.dataset.item + " \u00d7 " + qty);
            });

            if (!table || picked.length === 0) {
                alert("Select a table and at least one item.");
                return;
            }

            const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const orderId = orderCounter++;

            const emptyNote = document.querySelector("#ordersList .empty-note");
            if (emptyNote) emptyNote.remove();

            const card = document.createElement("div");
            card.className = "order-card";
            card.dataset.order = orderId;
            card.innerHTML =
                '<div class="order-top">' +
                '<span><span class="order-table-tag">' + table + '</span><b>Order #' + orderId + '</b><br>' +
                '<span class="small">' + customer + ' &middot; placed ' + now + '</span></span>' +
                '<span class="status status-blue">Placed</span>' +
                '</div>' +
                '<div class="food-desc">' + picked.join(" &middot; ") + '</div>' +
                '<div class="progress">' +
                '<div class="step active">Placed</div>' +
                '<div class="step">In Kitchen</div>' +
                '<div class="step">Ready</div>' +
                '<div class="step">Served</div>' +
                '<div class="step">Delivered</div>' +
                '</div>' +
                '<div class="order-actions"><button class="btn2 mark-delivered">Mark Delivered</button></div>';

            document.getElementById("ordersList").appendChild(card);

            addOrderForm.reset();
            document.querySelectorAll("#menuPickList .qty-value").forEach(function (v) { v.textContent = "0"; });
            document.getElementById("addOrderModal").classList.remove("show");
        });
    }

    /* ---------- Mark Delivered (event delegation for dynamic orders) ---------- */
    document.getElementById("ordersList").addEventListener("click", function (e) {
        if (!e.target.classList.contains("mark-delivered")) return;
        if (e.target.classList.contains("done")) return;

        const orderCard = e.target.closest(".order-card");
        orderCard.querySelectorAll(".step").forEach(function (step) {
            step.classList.remove("active");
            step.classList.add("done");
        });
        const statusBadge = orderCard.querySelector(".status");
        statusBadge.textContent = "Delivered";
        statusBadge.className = "status status-open";

        e.target.textContent = "Delivered";
        e.target.classList.add("done");
    });

});
