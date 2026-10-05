


var ACTIVITY_STORAGE_KEY = "rf_activity";


var MAX_ACTIVITY_ROWS = 6;


var dashSearchText = "";
var dashCategoryFilter = "all";
var allOrders = [];




function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  var toastBox = document.getElementById("toast");
  if (!toastBox) {
    return;
  }
  toastBox.textContent = message;
  toastBox.classList.add("show");
  window.clearTimeout(window._toastTimer);
  window._toastTimer = window.setTimeout(function () {
    toastBox.classList.remove("show");
  }, 2500);
}

function openModal(innerHtml) {
  var modalBody = document.getElementById("modalBody");
  var modalBackdrop = document.getElementById("modal");
  if (!modalBody || !modalBackdrop) {
    return;
  }
  modalBody.innerHTML = innerHtml;
  modalBackdrop.classList.add("open");
}

function closeModal() {
  var modalBackdrop = document.getElementById("modal");
  if (modalBackdrop) {
    modalBackdrop.classList.remove("open");
  }
}




function loadActivity() {
  var text = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  if (!text) {
    return [];
  }
  return JSON.parse(text);
}

function saveActivity(list) {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(list));
}


function addActivity(message, dotColor) {
  var list = loadActivity();
  list.unshift({ text: message, color: dotColor, time: Date.now() });
  while (list.length > MAX_ACTIVITY_ROWS) {
    list.pop();
  }
  saveActivity(list);
}


function timeAgoLabel(pastTimeMs) {
  var minutes = Math.round((Date.now() - pastTimeMs) / 60000);
  if (minutes <= 0) {
    return "0s ago";
  }
  if (minutes === 1) {
    return "1m ago";
  }
  return minutes + "m ago";
}




var ITEM_CATEGORY_LOOKUP = {
  "Grilled Atlantic Salmon": "Main",
  "Sautéed Broccolini": "Appetizer",
  "Sparkling Water": "Drinks",
  "Dry-Aged Ribeye (10oz)": "Main",
  "Truffle Parmesan Fries": "Appetizer",
  "Classic Margherita": "Main",
  "Caesar Salad": "Salad",
  "Mushroom Risotto": "Main",
  "Chicken Piccata": "Main",
  "Dry-Aged Ribeye Steak": "Main",
  "Daily Special": "Main"
};

function guessCategory(itemName) {
  if (ITEM_CATEGORY_LOOKUP[itemName]) {
    return ITEM_CATEGORY_LOOKUP[itemName];
  }
  return "Main"; // if we don't know it, just guess Main
}



function orderMatchesFilters(order) {
  var searchText = dashSearchText.trim().toLowerCase();


  if (dashCategoryFilter !== "all") {
    var hasCategory = false;
    for (var i = 0; i < order.items.length; i++) {
      var category = order.items[i].category || guessCategory(order.items[i].name);
      if (category === dashCategoryFilter) {
        hasCategory = true;
      }
    }
    if (!hasCategory) {
      return false;
    }
  }


  if (searchText === "") {
    return true;
  }

 
  var haystack = "#" + order.id + " " + order.table + " " + order.area;
  for (var j = 0; j < order.items.length; j++) {
    haystack += " " + order.items[j].name;
  }
  haystack = haystack.toLowerCase();

  return haystack.indexOf(searchText) !== -1;
}



function buildItemsHtml(order) {
  var html = "";
  for (var i = 0; i < order.items.length; i++) {
    var item = order.items[i];
    html += "<div><b>" + item.qty + "×</b> " + escapeHtml(item.name) + "</div>";
    if (item.note) {
      html += '<div class="dash-note">↳ ' + escapeHtml(item.note) + "</div>";
    }
  }
  return html;
}


function buildKitchenCardHtml(order) {
  var html = "";
  html += '<div class="dash-order">';
  html += '  <div class="dash-order-top"><h3>#' + order.id + '</h3>';
  html += '    <span style="color:var(--status-yellow-dark)">●</span></div>';
  html += '  <div class="dash-meta">' + order.table + " · " + order.area + "</div>";
  html += '  <div class="dash-items">' + buildItemsHtml(order) + "</div>";
  html += '  <div class="dash-order-foot" style="display:flex;justify-content:space-between;align-items:center">';
  html += '    <span class="dash-timer">🍳 Cooking</span>';
  html += '    <button class="dash-action" data-action="mark-ready" data-id="' + order.id + '">Mark Ready</button>';
  html += "  </div>";
  html += "</div>";
  return html;
}


function buildReadyCardHtml(order) {
  var html = "";
  html += '<div class="dash-order">';
  html += '  <div class="dash-order-top"><h3>#' + order.id + '</h3>';
  html += '    <span style="color:var(--status-green)">○</span></div>';
  html += '  <div class="dash-meta">' + order.table + " · " + order.area + "</div>";
  html += '  <div class="dash-items">' + buildItemsHtml(order) + "</div>";
  html += '  <div class="dash-order-foot" style="display:flex;justify-content:space-between;align-items:center">';
  html += '    <span class="dash-timer" style="color:var(--status-green-dark)">🕐 Live · ' + order.items.length + " items</span>";
  html += '    <button class="dash-action" data-action="pickup" data-id="' + order.id + '">Pickup</button>';
  html += "  </div>";
  html += "</div>";
  return html;
}


function buildCompletedCardHtml(order) {
  var html = "";
  html += '<div class="dash-complete-card">';
  html += "  <b>#" + order.id + "</b>";
  html += '  <div class="tiny">' + order.table + " · " + order.area + "</div>";
  html += '  <div class="tiny" style="margin-top:6px">' + order.items.length + " items · picked up</div>";
  html += "</div>";
  return html;
}




function renderDashboard() {
  var kitchenOrders = [];
  var readyOrders = [];
  var completedOrders = [];

  for (var i = 0; i < allOrders.length; i++) {
    var order = allOrders[i];
    if (order.status === "prep" && orderMatchesFilters(order)) {
      kitchenOrders.push(order);
    } else if (order.status === "ready" && orderMatchesFilters(order)) {
      readyOrders.push(order);
    } else if (order.status === "done" && orderMatchesFilters(order)) {
      completedOrders.push(order);
    }
  }


  document.getElementById("dashKitchenCount").textContent = kitchenOrders.length + " orders";
  if (kitchenOrders.length === 0) {
    document.getElementById("dashKitchenCol").innerHTML = '<div class="dash-empty">No orders in kitchen.</div>';
  } else {
    var kitchenHtml = "";
    for (var k = 0; k < kitchenOrders.length; k++) {
      kitchenHtml += buildKitchenCardHtml(kitchenOrders[k]);
    }
    document.getElementById("dashKitchenCol").innerHTML = kitchenHtml;
  }

 
  document.getElementById("dashReadyCount").textContent = readyOrders.length + " orders";
  if (readyOrders.length === 0) {
    document.getElementById("dashReadyCol").innerHTML = '<div class="dash-empty">No orders ready yet.</div>';
  } else {
    var readyHtml = "";
    for (var r = 0; r < readyOrders.length; r++) {
      readyHtml += buildReadyCardHtml(readyOrders[r]);
    }
    document.getElementById("dashReadyCol").innerHTML = readyHtml;
  }


  document.getElementById("dashCompletedCount").textContent = completedOrders.length;
  if (completedOrders.length === 0) {
    document.getElementById("dashCompletedCol").innerHTML = '<div class="dash-empty">No completed orders yet.</div>';
  } else {
    var completedHtml = "";
    for (var c = 0; c < completedOrders.length; c++) {
      completedHtml += buildCompletedCardHtml(completedOrders[c]);
    }
    document.getElementById("dashCompletedCol").innerHTML = completedHtml;
  }

  renderActivity();
}


function renderActivity() {
  var list = loadActivity();
  var box = document.getElementById("dashActivity");
  if (!box) {
    return;
  }
  if (list.length === 0) {
    box.innerHTML = '<div class="tiny">No recent activity yet.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < list.length; i++) {
    var row = list[i];
    html += '<div class="activity-row">';
    html += '  <span class="activity-dot ' + row.color + '"></span>';
    html += '  <span class="activity-text">' + escapeHtml(row.text) + "</span>";
    html += '  <span class="activity-time">' + timeAgoLabel(row.time) + "</span>";
    html += "</div>";
  }
  box.innerHTML = html;
}




async function handleColumnClick(event) {
  var button = event.target.closest("button");
  if (!button) {
    return;
  }
  var action = button.getAttribute("data-action");
  var orderId = Number(button.getAttribute("data-id"));

  if (action === "mark-ready") {
    try {
      if (!(await changeOrderStatus(orderId, "ready"))) return;
    } catch (error) {
      chefApiShowError(error);
      return;
    }
    addActivity("Order #" + orderId + " ready for pickup", "green");
    showToast("Order #" + orderId + " marked ready.");
  } else if (action === "pickup") {
    try {
      if (!(await changeOrderStatus(orderId, "done"))) return;
    } catch (error) {
      chefApiShowError(error);
      return;
    }
    addActivity("Order #" + orderId + " picked up", "orange");
    showToast("Order #" + orderId + " picked up.");
  }
  renderDashboard();
}

document.getElementById("dashKitchenCol").addEventListener("click", handleColumnClick);
document.getElementById("dashReadyCol").addEventListener("click", handleColumnClick);


async function changeOrderStatus(orderId, newStatus) {
  await chefApiPost("chef_orders.php", {
    action: "update_status",
    id: orderId,
    status: newStatus
  });
  return await refreshDashboardFromApi();
}

async function refreshDashboardFromApi() {
  try {
    var result = await chefApiRequest("chef_orders.php");
    allOrders = result.orders;
    renderDashboard();
    return true;
  } catch (error) {
    chefApiShowError(error);
    return false;
  }
}




var dashSearchInput = document.getElementById("dashSearch");
if (dashSearchInput) {
  dashSearchInput.addEventListener("input", function () {
    dashSearchText = dashSearchInput.value;
    renderDashboard();
  });
}

var dashCategorySelect = document.getElementById("dashCategory");
if (dashCategorySelect) {
  dashCategorySelect.addEventListener("change", function () {
    dashCategoryFilter = dashCategorySelect.value;
    renderDashboard();
  });
}



document.body.addEventListener("click", function (event) {
  if (event.target.getAttribute && event.target.getAttribute("data-action") === "close-modal") {
    closeModal();
  }
});

var modalBackdropEl = document.getElementById("modal");
if (modalBackdropEl) {
  modalBackdropEl.addEventListener("click", function (event) {
    if (event.target === modalBackdropEl) {
      closeModal();
    }
  });
}



var avatarButton = document.getElementById("avatarBtn");
var accountMenu = document.getElementById("accountMenu");
if (avatarButton && accountMenu) {
  avatarButton.addEventListener("click", function (event) {
    event.stopPropagation();
    accountMenu.classList.toggle("open");
  });
  document.addEventListener("click", function () {
    accountMenu.classList.remove("open");
  });
}

var accountDetailsButton = document.getElementById("accountDetailsBtn");
if (accountDetailsButton) {
  accountDetailsButton.addEventListener("click", function () {
    showToast("Account details are not available in this demo yet.");
  });
}

var switchChefButton = document.getElementById("switchChefBtn");
if (switchChefButton) {
  switchChefButton.addEventListener("click", function () {
    showToast("Switch chef is not available in this demo yet.");
  });
}

renderDashboard();
refreshDashboardFromApi();
window.setInterval(refreshDashboardFromApi, 30000);
