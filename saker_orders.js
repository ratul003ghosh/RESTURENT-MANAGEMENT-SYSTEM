


var ORDERS_STORAGE_KEY = "rf_orders";

var SHIFT_STORAGE_KEY = "rf_on_shift";


var LOCK_MINUTES = 45;


var REFRESH_EVERY_MS = 30000;

var currentFilter = "all";

var sortSoonestFirst = true;


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



function loadOrdersFromStorage() {
  var text = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!text) {
    return null;
  }
  return JSON.parse(text);
}


function saveOrdersToStorage(orderList) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orderList));
}

function buildStartingOrders() {
  var now = Date.now(); 

  function minutesFromNow(minutes) {
    return now + minutes * 60000;
  }

  return [
    {
      id: 4450,
      table: "T7",
      area: "Patio",
      rush: false,
      status: "queued", 
      startTime: minutesFromNow(-2), 
      items: [
        { qty: 1, name: "Grilled Atlantic Salmon", note: "No asparagus" },
        { qty: 1, name: "Sautéed Broccolini" },
        { qty: 2, name: "Sparkling Water" }
      ]
    },
    {
      id: 4451,
      table: "T2",
      area: "Main",
      rush: true,
      status: "queued",
      startTime: minutesFromNow(-5),
      items: [
        { qty: 2, name: "Dry-Aged Ribeye (10oz)", note: "1× medium rare, 1× medium" },
        { qty: 2, name: "Truffle Parmesan Fries" }
      ]
    },
    {
      id: 4449,
      table: "T1",
      area: "Main",
      rush: false,
      status: "queued",
      startTime: minutesFromNow(6),
      items: [
        { qty: 1, name: "Classic Margherita", note: "Extra basil" },
        { qty: 1, name: "Caesar Salad" },
        { qty: 1, name: "Sparkling Water" }
      ]
    },
    {
      id: 4448,
      table: "T11",
      area: "Bar",
      rush: false,
      status: "queued",
      startTime: minutesFromNow(12),
      items: [
        { qty: 1, name: "Mushroom Risotto", note: "No parmesan" },
        { qty: 1, name: "Sparkling Water" }
      ]
    },
    {
      id: 4447,
      table: "T4",
      area: "Main",
      rush: false,
      status: "queued",
      startTime: minutesFromNow(18),
      items: [
        { qty: 1, name: "Chicken Piccata" },
        { qty: 1, name: "Caesar Salad" }
      ]
    },
    {
      id: 4446,
      table: "T8",
      area: "Main",
      rush: false,
      status: "queued",
      startTime: minutesFromNow(24),
      items: [
        { qty: 2, name: "Dry-Aged Ribeye Steak", note: "Medium" },
        { qty: 2, name: "Sparkling Water" }
      ]
    },
    {
      id: 4445,
      table: "T14",
      area: "Bar",
      rush: false,
      status: "queued",
      startTime: minutesFromNow(30),
      items: [
        { qty: 1, name: "Mushroom Risotto" },
        { qty: 1, name: "Chicken Piccata" }
      ]
    }
  ];
}


if (!allOrders) {
  allOrders = buildStartingOrders();
  saveOrdersToStorage(allOrders);
}


function getMinutesUntilStart(order) {
  var diffMs = order.startTime - Date.now();
  return Math.round(diffMs / 60000);
}

function getOrderGroup(order) {
  var minutesLeft = getMinutesUntilStart(order);
  if (minutesLeft > LOCK_MINUTES) {
    return "locked";
  }
  if (minutesLeft > 0) {
    return "upcoming";
  }
  return "ready";
}


function countItems(order) {
  var total = 0;
  for (var i = 0; i < order.items.length; i++) {
    total = total + order.items[i].qty;
  }
  return total;
}




function buildItemsHtml(order) {
  var html = "";
  for (var i = 0; i < order.items.length; i++) {
    var item = order.items[i];
    html += "<div><b>" + item.qty + "×</b> " + escapeHtml(item.name) + "</div>";
    if (item.note) {
      html += '<div class="tiny" style="margin-left:14px">↳ ' + escapeHtml(item.note) + "</div>";
    }
  }
  return html;
}


function buildTagsHtml(order, group) {
  var html = "";

  if (order.rush) {
    html += '<span class="tag" style="background:var(--status-red);color:#fff">↗ RUSH</span>';
  }

  if (group === "ready") {
    html += '<span class="tag" style="color:var(--status-green-dark)">READY TO START</span>';
  } else if (group === "upcoming") {
    html += '<span class="tag" style="color:var(--text-secondary)">UPCOMING</span>';
  } else {
    html += '<span class="tag" style="color:var(--status-yellow-dark)">LOCKED</span>';
  }

  return html;
}


function buildActionsHtml(order, group) {
  var html = '<button class="btn" data-action="recipe" data-id="' + order.id + '">⊙ View Recipe</button>';

  if (group === "locked") {
    var minutesLeft = getMinutesUntilStart(order);
    var minutesUntilUnlock = minutesLeft - LOCK_MINUTES;
    html += '<span class="locktime">🔒 Unlocks in ' + minutesUntilUnlock + "m</span>";
  } else {
    html += '<button class="btn" data-action="start" data-id="' + order.id + '">♨ Start Prep</button>';
  }

  return html;
}


function buildOrderCardHtml(order) {
  var group = getOrderGroup(order);


  var cardClass = group === "ready" ? "queue-card" : "queue-card locked";

  var html = "";
  html += '<div class="' + cardClass + '">';
  html += '  <div class="qtop">';
  html += "    🍽️ <b>#" + order.id + "</b>";
  html += buildTagsHtml(order, group);
  html += "  </div>";
  html += '  <div class="tiny">↳ ' + order.table + " · " + order.area + " · " + countItems(order) + " items</div>";
  html += '  <div class="items" style="margin-top:8px">' + buildItemsHtml(order) + "</div>";
  html += '  <div class="qactions">' + buildActionsHtml(order, group) + "</div>";
  html += "</div>";
  return html;
}



function buildSectionHtml(title, dotColor, ordersInGroup) {
  var html = '<div class="queue-section">';
  html += '<div class="section-title"><span style="color:' + dotColor + '">●</span> ' + title + "</div>";
  for (var i = 0; i < ordersInGroup.length; i++) {
    html += buildOrderCardHtml(ordersInGroup[i]);
  }
  html += "</div>";
  return html;
}




function renderQueue() {

  var queuedOrders = [];
  for (var i = 0; i < allOrders.length; i++) {
    if (allOrders[i].status === "queued") {
      queuedOrders.push(allOrders[i]);
    }
  }


  queuedOrders.sort(function (a, b) {
    if (sortSoonestFirst) {
      return a.startTime - b.startTime;
    } else {
      return b.startTime - a.startTime;
    }
  });

  var readyOrders = [];
  var upcomingOrders = [];
  var lockedOrders = [];
  for (var j = 0; j < queuedOrders.length; j++) {
    var group = getOrderGroup(queuedOrders[j]);
    if (group === "ready") {
      readyOrders.push(queuedOrders[j]);
    } else if (group === "upcoming") {
      upcomingOrders.push(queuedOrders[j]);
    } else {
      lockedOrders.push(queuedOrders[j]);
    }
  }

  
  var inPrepCount = 0;
  for (var k = 0; k < allOrders.length; k++) {
    if (allOrders[k].status === "prep") {
      inPrepCount = inPrepCount + 1;
    }
  }

  document.getElementById("gatedCount").textContent = lockedOrders.length;
  document.getElementById("qReady").textContent = readyOrders.length;
  document.getElementById("qPrep").textContent = inPrepCount;

  
  var totalQueued = readyOrders.length + upcomingOrders.length + lockedOrders.length;
  var totalUnlocked = readyOrders.length + upcomingOrders.length;
  document.getElementById("allCount").textContent = totalQueued;
  document.getElementById("lockedCount").textContent = lockedOrders.length;
  document.getElementById("unlockedCount").textContent = totalUnlocked;

 
  var html = "";
  var showLocked = currentFilter === "all" || currentFilter === "locked";
  var showUnlocked = currentFilter === "all" || currentFilter === "unlocked";

  if (showUnlocked && readyOrders.length > 0) {
    html += buildSectionHtml("READY TO START", "var(--status-green)", readyOrders);
  }
  if (showUnlocked && upcomingOrders.length > 0) {
    html += buildSectionHtml("UPCOMING", "var(--text-secondary)", upcomingOrders);
  }
  if (showLocked && lockedOrders.length > 0) {
    html += buildSectionHtml("LOCKED", "var(--status-yellow-dark)", lockedOrders);
  }

  if (html === "") {
    html = '<div class="empty">No orders to show right now.</div>';
  }

  document.getElementById("queue").innerHTML = html;
}



document.getElementById("queue").addEventListener("click", function (event) {
  var button = event.target.closest("button");
  if (!button) {
    return;
  }

  var action = button.getAttribute("data-action");
  var orderId = Number(button.getAttribute("data-id"));

  if (action === "start") {
    startPrepForOrder(orderId);
  } else if (action === "recipe") {
    showRecipePreview(orderId);
  }
});


function findOrderById(orderId) {
  for (var i = 0; i < allOrders.length; i++) {
    if (allOrders[i].id === orderId) {
      return allOrders[i];
    }
  }
  return null;
}

function startPrepForOrder(orderId) {
  var order = findOrderById(orderId);
  if (!order) {
    return;
  }
  order.status = "prep";
  saveOrdersToStorage(allOrders);
  showToast("Order #" + orderId + " sent to the kitchen for prep.");
  renderQueue();
}


function showRecipePreview(orderId) {
  var order = findOrderById(orderId);
  if (!order) {
    return;
  }
  var html = "";
  html += '<div class="modal-head"><h2>Order #' + order.id + "</h2>";
  html += '<button class="close" data-action="close-modal">×</button></div>';
  html += '<div class="tiny">' + order.table + " · " + order.area + "</div>";
  html += '<div class="recipe-preview">' + buildItemsHtml(order) + "</div>";
  openModal(html);
}




var filterButtons = document.querySelectorAll(".pill[data-filter]");
for (var f = 0; f < filterButtons.length; f++) {
  filterButtons[f].addEventListener("click", function (event) {
   
    for (var g = 0; g < filterButtons.length; g++) {
      filterButtons[g].classList.remove("active");
    }
    
    event.currentTarget.classList.add("active");
    currentFilter = event.currentTarget.getAttribute("data-filter");
    renderQueue();
  });
}


var sortButton = document.getElementById("releaseSort");
if (sortButton) {
  sortButton.addEventListener("click", function () {
    sortSoonestFirst = !sortSoonestFirst;
    var arrow = sortButton.querySelector("span");
    if (arrow) {
      arrow.textContent = sortSoonestFirst ? "⌄" : "⌃";
    }
    renderQueue();
  });
}


var gatingInfoButton = document.getElementById("gatingInfo");
if (gatingInfoButton) {
  gatingInfoButton.addEventListener("click", function () {
    var html = "";
    html += '<div class="modal-head"><h2>How gating works</h2>';
    html += '<button class="close" data-action="close-modal">×</button></div>';
    html += '<p class="tiny" style="margin-top:12px">Every order has a best time to start cooking, ';
    html += "so food does not sit and get cold before it is served.</p>";
    html += '<div class="itemcard"><b style="color:var(--status-green-dark)">Ready to start</b>';
    html += '<div class="tiny">Its time has come — start cooking now.</div></div>';
    html += '<div class="itemcard"><b style="color:var(--text-secondary)">Upcoming</b>';
    html += '<div class="tiny">Not locked, just waiting for its moment to arrive.</div></div>';
    html += '<div class="itemcard"><b style="color:var(--status-yellow-dark)">Locked</b>';
    html += '<div class="tiny">Still more than ' + LOCK_MINUTES + " minutes away — please wait.</div></div>";
    openModal(html);
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


var shiftChipButton = document.getElementById("shiftChip");
if (shiftChipButton) {
  function paintShiftButton(isOnShift) {
    if (isOnShift) {
      shiftChipButton.textContent = "● On Shift";
      shiftChipButton.classList.add("on");
    } else {
      shiftChipButton.textContent = "● Off Shift";
      shiftChipButton.classList.remove("on");
    }
  }


  var savedShift = localStorage.getItem(SHIFT_STORAGE_KEY);
  paintShiftButton(savedShift === "true");

  shiftChipButton.addEventListener("click", function () {
    var isOnNow = shiftChipButton.classList.contains("on");
    var turningOn = !isOnNow;
    paintShiftButton(turningOn);
    localStorage.setItem(SHIFT_STORAGE_KEY, turningOn ? "true" : "false");
  });
}




renderQueue();


window.setInterval(renderQueue, REFRESH_EVERY_MS);
