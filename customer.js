
document.addEventListener("DOMContentLoaded", function () {
    function showMessage(target, text, isError) {
        if (!target) return;
        target.textContent = text;
        target.classList.toggle("error", Boolean(isError));
    }

    function formatMoney(value) {
        return Number(value).toFixed(2).replace(/\.00$/, "") + " Tk";
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    const loginForm = document.getElementById("customerLoginForm") || document.getElementById("waiterLoginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const message = document.getElementById("authMessage");
            try {
                const fields = Object.fromEntries(new FormData(loginForm));
                const result = await window.rmsRequest("login", {
                    method: "POST",
                    body: { ...fields, role: loginForm.dataset.role || "customer" }
                });
                window.location.href = result.user.role === "waiter" ? "waiter-dashboard.html" : "customer-dashboard.html";
            } catch (error) {
                showMessage(message, error.message, true);
            }
        });
    }

    const registerForm = document.getElementById("customerRegisterForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const message = document.getElementById("authMessage");
            try {
                const result = await window.rmsRequest("register", {
                    method: "POST",
                    body: Object.fromEntries(new FormData(registerForm))
                });
                registerForm.reset();
                showMessage(message, result.message, false);
            } catch (error) {
                showMessage(message, error.message, true);
            }
        });
    }

    document.querySelectorAll('a[href="index.html"]').forEach(function (link) {
        if (!link.textContent.trim().toLowerCase().includes("logout")) return;
        link.addEventListener("click", function (event) {
            event.preventDefault();
            window.rmsRequest("logout", { method: "POST" }).finally(function () {
                window.location.href = "index.html";
            });
        });
    });

    document.addEventListener("click", function (event) {
        const button = event.target.closest("[data-modal]");
        if (!button) return;
        const modal = document.getElementById(button.dataset.modal);
        if (modal && modal.id === "customizeModal") customizeCard = button.closest(".food-card");
        if (modal) modal.classList.add("show");
    });
    document.querySelectorAll(".modal-close").forEach(function (button) {
        button.addEventListener("click", function () {
            button.closest(".modal").classList.remove("show");
        });
    });

    const filterBar = document.querySelector(".filter-bar");
    if (filterBar) {
        filterBar.addEventListener("click", function (event) {
            const button = event.target.closest(".category-btn");
            if (!button) return;
            document.querySelectorAll(".category-btn").forEach(function (categoryButton) {
                categoryButton.classList.toggle("btn", categoryButton === button);
                categoryButton.classList.toggle("btn2", categoryButton !== button);
            });
            document.querySelectorAll(".food-card").forEach(function (card) {
                card.style.display = button.dataset.category === "all" || card.dataset.category === button.dataset.category ? "" : "none";
            });
        });
    }

    const menuSearch = document.getElementById("menuSearch");
    if (menuSearch) {
        menuSearch.addEventListener("input", function () {
            const searchText = menuSearch.value.toLowerCase().trim();
            document.querySelectorAll(".food-card").forEach(function (card) {
                const itemName = card.querySelector(".food-name").textContent.toLowerCase();
                const itemDescription = card.querySelector(".food-desc").textContent.toLowerCase();
                card.style.display = itemName.includes(searchText) || itemDescription.includes(searchText) ? "" : "none";
            });
        });
    }

    const menuPage = document.querySelector(".menu-list");
    const cartMessage = document.getElementById("cartMessage");
    let customizeCard = null;
    function getCart() {
        try {
            return JSON.parse(sessionStorage.getItem("rmsCart") || "[]");
        } catch (error) {
            return [];
        }
    }
    function saveCart(cart) {
        sessionStorage.setItem("rmsCart", JSON.stringify(cart));
    }
    const customizeForm = document.getElementById("customizeForm");
    if (customizeForm) {
        customizeForm.addEventListener("submit", function (event) {
            event.preventDefault();
            if (!customizeCard) return;
            const customizations = Object.fromEntries(new FormData(customizeForm));
            customizeCard.dataset.customizations = JSON.stringify(customizations);
            document.getElementById("customizeModal").classList.remove("show");
            showMessage(cartMessage, "Customization selected. Click Order to add this meal.", false);
        });
    }
    if (menuPage) {
        window.rmsRequest("menu").then(function (result) {
            menuPage.replaceChildren();
            if (filterBar) {
                const allButton = makeElement("button", "category-btn btn", "All");
                allButton.type = "button";
                allButton.dataset.category = "all";
                filterBar.replaceChildren(allButton);
                const categories = Array.from(new Set(result.items.map(function (item) {
                    return String(item.category || "Other").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                })));
                categories.forEach(function (category) {
                    const button = makeElement("button", "category-btn btn2", category.replace(/-/g, " ").replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }));
                    button.type = "button";
                    button.dataset.category = category;
                    filterBar.appendChild(button);
                });
            }
            result.items.forEach(function (item) {
                const category = String(item.category || "Other").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                const card = makeElement("div", "card menu-item food-card");
                card.dataset.category = category;
                card.dataset.itemName = item.name;
                const image = makeElement("img", "menu-image");
                image.alt = item.name;
                const imageByCategory = {
                    pizza: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
                    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
                    pasta: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
                    dessert: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
                    drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80",
                    "main-course": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80"
                };
                image.src = /^https?:\/\//i.test(item.image || "") ? item.image : imageByCategory[category] || imageByCategory["main-course"];
                const info = makeElement("div", "menu-info");
                const name = makeElement("div", "food-name");
                name.append(document.createTextNode(item.name + " "), makeElement("span", "price", formatMoney(item.price)));
                info.append(name, makeElement("div", "food-desc", item.description || ""), makeElement("span", "menu-tag", item.category || "Other"));
                const actions = makeElement("div", "menu-actions");
                const orderLink = makeElement("a", "btn full-btn", "Order");
                orderLink.href = "customer-orders.html";
                actions.appendChild(orderLink);
                if (Number(item.is_customizable)) {
                    const customizeButton = makeElement("button", "btn2 full-btn", "Customize");
                    customizeButton.type = "button";
                    customizeButton.dataset.modal = "customizeModal";
                    actions.appendChild(customizeButton);
                }
                const quantityControl = makeElement("div", "qty-control menu-quantity-control");
                const minus = makeElement("button", "qty-btn menu-qty-minus", "−");
                minus.type = "button";
                minus.setAttribute("aria-label", "Decrease " + item.name + " quantity");
                const quantity = makeElement("span", "qty-value menu-qty-value", "1");
                const plus = makeElement("button", "qty-btn menu-qty-plus", "+");
                plus.type = "button";
                plus.setAttribute("aria-label", "Increase " + item.name + " quantity");
                quantityControl.append(minus, quantity, plus);
                actions.appendChild(quantityControl);
                card.append(image, info, actions);
                menuPage.appendChild(card);
            });
        }).catch(function (error) {
            showMessage(cartMessage, error.message, true);
        });

        menuPage.addEventListener("click", function (event) {
            const quantityButton = event.target.closest(".menu-qty-minus, .menu-qty-plus");
            if (quantityButton) {
                const quantity = quantityButton.closest(".food-card").querySelector(".menu-qty-value");
                const current = Number(quantity.textContent);
                quantity.textContent = String(quantityButton.classList.contains("menu-qty-plus") ? current + 1 : Math.max(0, current - 1));
                return;
            }
            const orderLink = event.target.closest('a[href="customer-orders.html"]');
            if (!orderLink) return;
            event.preventDefault();
            const card = orderLink.closest(".food-card");
            const nameElement = card.querySelector(".food-name");
            const itemName = card.dataset.itemName || nameElement.firstChild.textContent.trim();
            const quantityElement = card.querySelector(".menu-qty-value");
            const quantity = quantityElement ? Number(quantityElement.textContent) : 1;
            if (quantity < 1) {
                showMessage(cartMessage, "Increase the quantity before clicking Order.", true);
                return;
            }
            let customizations = {};
            try {
                customizations = JSON.parse(card.dataset.customizations || "{}");
            } catch (error) {
                customizations = {};
            }
            const cart = getCart();
            const existing = cart.find(function (item) {
                return item.name === itemName && JSON.stringify(item.customizations || {}) === JSON.stringify(customizations);
            });
            if (existing) existing.quantity += quantity;
            else cart.push({ name: itemName, quantity: quantity, customizations: customizations });
            saveCart(cart);
            card.dataset.customizations = "{}";
            if (quantityElement) quantityElement.textContent = "1";
            showMessage(cartMessage, itemName + " × " + quantity + " added to your order.", false);
        });
    }

    const placeOrderButton = document.getElementById("placeCustomerOrder");
    if (placeOrderButton) {
        placeOrderButton.addEventListener("click", async function () {
            const cart = getCart();
            if (!cart.length) {
                showMessage(cartMessage, "Add at least one menu item first.", true);
                return;
            }
            try {
                const result = await window.rmsRequest("orders", { method: "POST", body: { items: cart } });
                sessionStorage.removeItem("rmsCart");
                window.location.href = "customer-orders.html?order_id=" + encodeURIComponent(result.order_id);
            } catch (error) {
                showMessage(cartMessage, error.message, true);
            }
        });
    }

    const reservationDate = document.getElementById("reservationDate");
    const reservationSlots = document.querySelectorAll(".slot[data-time]");
    const selectedTableLabel = document.getElementById("selectedTable");
    let selectedTableId = null;
    let selectedTime = null;
    async function refreshAvailability() {
        if (!reservationDate || !selectedTime) return;
        selectedTableId = null;
        if (selectedTableLabel) selectedTableLabel.textContent = "None";
        document.querySelectorAll(".reservation-table").forEach(function (card) {
            card.classList.remove("selected", "unavailable");
        });
        try {
            const result = await window.rmsRequest("availability", {
                params: { date: reservationDate.value, time: selectedTime }
            });
            const statusList = document.getElementById("reservationTableStatus");
            if (statusList) {
                statusList.replaceChildren(makeElement("b", "", "Availability for " + selectedTime));
                result.tables.forEach(function (table) {
                    const row = makeElement("div", "order-row");
                    row.append(
                        makeElement("span", "", table.table_number + " · " + table.seats + " seats"),
                        makeElement("span", "status " + (Number(table.available) === 1 ? "status-open" : "status-pending"), Number(table.available) === 1 ? "Available" : "Booked")
                    );
                    statusList.appendChild(row);
                });
            }
            result.tables.forEach(function (table) {
                const card = document.querySelector('.reservation-table[data-table="' + table.table_number + '"]');
                if (!card) return;
                card.dataset.tableId = table.id;
                card.classList.toggle("available", Number(table.available) === 1);
                card.classList.toggle("unavailable", Number(table.available) !== 1);
                card.classList.toggle("occupied", Number(table.available) !== 1);
                const status = card.querySelector(".table-status");
                if (status) status.textContent = Number(table.available) === 1 ? "Available" : "Booked";
                const capacity = card.querySelector("p");
                if (capacity) capacity.textContent = table.seats + " Seats";
            });
        } catch (error) {
            showMessage(document.getElementById("reservationMessage"), error.message, true);
        }
    }
    reservationSlots.forEach(function (slot) {
        slot.addEventListener("click", function () {
            if (slot.classList.contains("disabled")) return;
            reservationSlots.forEach(function (candidate) { candidate.classList.remove("selected"); });
            slot.classList.add("selected");
            selectedTime = slot.dataset.time;
            refreshAvailability();
        });
    });
    if (reservationDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
        reservationDate.min = tomorrow.toISOString().slice(0, 10);
        reservationDate.value = reservationDate.min;
        reservationDate.addEventListener("change", refreshAvailability);
    }
    if (reservationSlots.length) {
        selectedTime = reservationSlots[0].dataset.time;
        reservationSlots[0].classList.add("selected");
        refreshAvailability();
    }
    document.querySelectorAll(".reservation-table").forEach(function (table) {
        table.addEventListener("click", function () {
            if (!table.classList.contains("available") || table.classList.contains("unavailable")) return;
            document.querySelectorAll(".reservation-table").forEach(function (candidate) { candidate.classList.remove("selected"); });
            table.classList.add("selected");
            selectedTableId = Number(table.dataset.tableId);
            if (selectedTableLabel) selectedTableLabel.textContent = table.dataset.table;
        });
    });
    const reservationButton = document.getElementById("confirmReservation");
    if (reservationButton) {
        reservationButton.addEventListener("click", async function () {
            const message = document.getElementById("reservationMessage");
            const guestCount = document.getElementById("guestCount");
            if (!selectedTableId || !selectedTime || !reservationDate.value) {
                showMessage(message, "Choose a date, time slot, and available table.", true);
                return;
            }
            try {
                const result = await window.rmsRequest("reservations", {
                    method: "POST",
                    body: { table_id: selectedTableId, guest_count: Number(guestCount.value), date: reservationDate.value, time: selectedTime }
                });
                showMessage(message, result.message, false);
                refreshAvailability();
            } catch (error) {
                showMessage(message, error.message, true);
                refreshAvailability();
            }
        });
    }

    const reservationSummary = document.getElementById("upcomingReservationCard");
    if (reservationSummary) {
        window.rmsRequest("reservations").then(function (result) {
            reservationSummary.replaceChildren(makeElement("b", "", "Your Upcoming Reservation"));
            const nextReservation = result.reservations.find(function (reservation) {
                return reservation.status !== "cancelled" && reservation.reservation_date >= new Date().toISOString().slice(0, 10);
            });
            if (!nextReservation) {
                reservationSummary.appendChild(makeElement("div", "food-desc", "No upcoming reservations."));
                return;
            }
            const dateTime = new Date(nextReservation.reservation_date + "T" + nextReservation.time_slot);
            reservationSummary.appendChild(makeElement("div", "food-desc", nextReservation.table_number + " · " + dateTime.toLocaleString() + " · " + nextReservation.guest_count + " guests"));
            reservationSummary.appendChild(makeElement("span", "status status-open", nextReservation.status));
        }).catch(function (error) {
            showMessage(reservationSummary, error.message, true);
        });
    }

    const dashboardGreeting = document.getElementById("customerGreeting");
    if (dashboardGreeting) {
        window.rmsRequest("me").then(function (result) {
            if (result.user) dashboardGreeting.textContent = "Welcome back, " + result.user.first_name + "!";
        });
        window.rmsRequest("orders").then(function (result) {
            const currentOrder = result.orders.find(function (order) { return order.status !== "Paid"; });
            const summary = document.getElementById("currentOrderSummary");
            const card = document.getElementById("dashboardCurrentOrder");
            card.replaceChildren();
            if (!currentOrder) {
                summary.textContent = "No unpaid orders.";
                card.appendChild(makeElement("p", "empty-note", "Your current order will appear here."));
                return;
            }
            summary.textContent = "Order #" + currentOrder.id + " · " + new Date(currentOrder.created_at.replace(" ", "T")).toLocaleString();
            card.appendChild(makeElement("div", "order-row", "Order #" + currentOrder.id + " · " + currentOrder.item_summary));
            card.appendChild(makeElement("div", "right", currentOrder.status + " · " + formatMoney(currentOrder.total)));
        }).catch(function (error) {
            showMessage(document.getElementById("dashboardCurrentOrder"), error.message, true);
        });
        window.rmsRequest("reservations").then(function (result) {
            const card = document.getElementById("dashboardReservation");
            if (!card) return;
            card.replaceChildren(makeElement("b", "", "Upcoming Reservation"));
            const nextReservation = result.reservations.find(function (reservation) { return reservation.status !== "cancelled"; });
            card.appendChild(makeElement("div", "food-desc", nextReservation ? nextReservation.table_number + " · " + nextReservation.reservation_date + " " + nextReservation.time_slot + " · " + nextReservation.guest_count + " guests" : "No upcoming reservations."));
        });
    }

    function createOrderCard(order, isHistory) {
        const card = makeElement("div", "card");
        const displayStatus = isHistory ? "Paid" : order.status === "Delivered" ? "Served" : order.status;
        const isPaid = isHistory || order.status === "Paid" || order.payment_status === "paid";
        const statusIndexByName = { "Placed": 0, "In Kitchen": 1, "Ready": 2, "Served": 3, "Delivered": 3, "Paid": 4 };
        const statusIndex = isPaid ? 4 : statusIndexByName[order.status] ?? 0;
        const needsPayment = !isHistory && ["Served", "Delivered"].includes(order.status) && order.payment_status !== "paid";
        const row = makeElement("div", "order-row");
        const heading = makeElement("span");
        heading.appendChild(makeElement("b", "", "Order #" + order.id));
        heading.appendChild(makeElement("br"));
        heading.appendChild(makeElement("span", "small", new Date(order.created_at.replace(" ", "T")).toLocaleString()));
        const badgeClass = needsPayment ? "status-pending" : order.status === "Paid" || statusIndex >= 3 ? "status-open" : "status-blue";
        row.append(heading, makeElement("span", "status " + badgeClass, needsPayment ? "Awaiting Payment" : displayStatus));
        card.append(row, makeElement("div", "food-desc", order.item_summary || ""));
        const progress = makeElement("div", "progress");
        progress.setAttribute("aria-label", "Order status: " + displayStatus);
        ["Placed", "In Kitchen", "Ready", "Served", "Paid"].forEach(function (step, index) {
            const stepClass = index < statusIndex || isPaid ? "step done" : index === statusIndex ? "step active" : "step";
            progress.appendChild(makeElement("div", stepClass, step));
        });
        card.appendChild(progress);
        card.appendChild(makeElement("div", "right", formatMoney(order.total)));
        const actions = makeElement("div", "order-actions");
        const viewOrder = makeElement("a", "btn2", "View Details");
        viewOrder.href = "customer-bill.html?order_id=" + encodeURIComponent(order.id);
        actions.appendChild(viewOrder);
        card.appendChild(actions);
        return card;
    }

    const ordersPage = document.getElementById("customerOrdersList");
    if (ordersPage) {
        window.rmsRequest("orders").then(function (result) {
            const currentOrderContainer = document.getElementById("currentOrderContainer");
            ordersPage.replaceChildren();
            if (!result.orders.length) {
                if (currentOrderContainer) currentOrderContainer.replaceChildren(makeElement("p", "empty-note", "No current order."));
                ordersPage.appendChild(makeElement("p", "empty-note", "No orders yet."));
                return;
            }
            const currentOrder = result.orders[0];
            if (currentOrderContainer) currentOrderContainer.replaceChildren(createOrderCard(currentOrder, false));
            result.orders.slice(1).forEach(function (order) {
                ordersPage.appendChild(createOrderCard(order, true));
            });
            if (!result.orders.slice(1).length) {
                ordersPage.appendChild(makeElement("p", "empty-note", "No previous orders."));
            }
            const selectedOrderId = new URLSearchParams(window.location.search).get("order_id");
            const billLink = document.getElementById("viewCurrentBill");
            if (billLink) {
                billLink.href = "customer-bill.html?order_id=" + encodeURIComponent(selectedOrderId || currentOrder.id);
            }
        }).catch(function (error) {
            showMessage(ordersPage, error.message, true);
        });
    }

    const billContent = document.getElementById("billContent");
    if (billContent) {
        billContent.replaceChildren(makeElement("b", "", "UIU Restaurant Hub"), makeElement("p", "empty-note", "Loading bill..."));
        const orderId = new URLSearchParams(window.location.search).get("order_id");
        window.rmsRequest("bill", { params: { order_id: orderId } }).then(function (result) {
            billContent.replaceChildren();
            if (!result.order) {
                billContent.appendChild(makeElement("p", "empty-note", "No order bill is available yet."));
                return;
            }
            const order = result.order;
            billContent.appendChild(makeElement("div", "page-sub", "Bill for Order #" + order.id + " · " + new Date(order.created_at.replace(" ", "T")).toLocaleDateString()));
            billContent.appendChild(makeElement("div", "food-desc", "Customer: " + order.customer_name + (order.table_number ? " · " + order.table_number : "")));
            result.items.forEach(function (item) {
                const description = item.item_name + " × " + item.quantity + (item.customization ? " · " + item.customization : "");
                billContent.appendChild(makeBillRow(description, formatMoney(item.line_total)));
            });
            billContent.appendChild(makeBillRow("Subtotal", formatMoney(order.subtotal)));
            billContent.appendChild(makeBillRow("Tax (5%)", formatMoney(order.tax)));
            billContent.appendChild(makeBillRow("Total", formatMoney(order.total), true));
            const status = document.getElementById("billStatus");
            if (status) status.textContent = order.payment_status === "paid" ? "Paid" : "Pending Payment";
            const printButton = makeElement("button", "btn", "Download / Print Bill");
            printButton.type = "button";
            printButton.id = "printBill";
            billContent.appendChild(printButton);
        }).catch(function (error) {
            showMessage(billContent, error.message, true);
        });
    }
    function makeBillRow(label, value, total) {
        const row = makeElement("div", "bill-row");
        row.append(makeElement("span", total ? "total" : "", label), makeElement("span", total ? "total" : "", value));
        return row;
    }

    const chatForm = document.getElementById("chatForm");
    const chatMessages = document.querySelector(".messages");
    if (chatForm && chatMessages) {
        window.rmsRequest("chat").then(function (result) {
            chatMessages.replaceChildren();
            result.messages.forEach(function (message) {
                chatMessages.appendChild(makeElement("div", "message " + (message.sender_role === "customer" ? "customer" : "restaurant"), message.message));
            });
        }).catch(function (error) {
            showMessage(chatMessages, error.message, true);
        });
        chatForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const input = document.getElementById("chatMessage");
            try {
                const result = await window.rmsRequest("chat", { method: "POST", body: { message: input.value.trim() } });
                chatMessages.appendChild(makeElement("div", "message customer", result.message.message));
                input.value = "";
            } catch (error) {
                showMessage(chatMessages, error.message, true);
            }
        });
    }

    document.addEventListener("click", function (event) {
        if (event.target.id === "printBill") window.print();
    });
});
