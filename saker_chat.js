


var CHAT_STORAGE_KEY = "rf_chat_messages";


var SHIFT_STORAGE_KEY = "rf_on_shift";


var CHAT_PEOPLE = [
  { id: "elena", name: "Elena K.", role: "Grill Station", status: "Online", isMe: true },
  { id: "marco", name: "Marco R.", role: "Sauté Station", status: "Online" },
  { id: "nina", name: "Nina P.", role: "Pastry Station", status: "Online" },
  { id: "sam", name: "Sam T.", role: "Prep Station", status: "Offline" }
];


var PRETEND_REPLIES = [
  "Got it, thanks!",
  "Sounds good.",
  "On it now.",
  "Copy that.",
  "Will do!"
];


var activePersonId = "marco";



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


function formatTimeOfDay(timestampMs) {
  var date = new Date(timestampMs);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";
  var hour12 = hours % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }
  var minuteText = minutes < 10 ? "0" + minutes : "" + minutes;
  return hour12 + ":" + minuteText + " " + ampm;
}

function findPersonById(personId) {
  for (var i = 0; i < CHAT_PEOPLE.length; i++) {
    if (CHAT_PEOPLE[i].id === personId) {
      return CHAT_PEOPLE[i];
    }
  }
  return null;
}




function loadAllMessages() {
  var text = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!text) {
    return null;
  }
  return JSON.parse(text);
}

function saveAllMessages(allMessages) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(allMessages));
}

function buildStartingMessages() {
  var now = Date.now();
  return {
    marco: [
      { from: "them", text: "Table 3 allergy check is confirmed. Salmon is dairy-safe.", time: now - 120000 },
      { from: "me", text: "Got it — I will keep the salmon separate.", time: now - 60000 }
    ],
    nina: [],
    sam: []
  };
}

var allMessages = loadAllMessages();
if (!allMessages) {
  allMessages = buildStartingMessages();
  saveAllMessages(allMessages);
}




function renderPeopleList() {
  var html = "";
  for (var i = 0; i < CHAT_PEOPLE.length; i++) {
    var person = CHAT_PEOPLE[i];
    var activeClass = person.id === activePersonId ? "person active" : "person";
    html += '<div class="' + activeClass + '" data-person-id="' + person.id + '">';
    html += "  <b>" + escapeHtml(person.name) + "</b>";
    html += "  <span>" + escapeHtml(person.role) + "</span>";
    html += "</div>";
  }
  document.getElementById("chatPeople").innerHTML = html;
}




function renderConversation() {
  var person = findPersonById(activePersonId);
  if (!person) {
    return;
  }

  document.getElementById("chatWith").textContent = person.name;
  document.getElementById("chatStatus").textContent = person.status;

  var messagesForPerson = allMessages[activePersonId] || [];
  var messagesBox = document.getElementById("messages");

  if (messagesForPerson.length === 0) {
    messagesBox.innerHTML = '<div class="tiny" style="text-align:center;margin-top:20px">No messages yet. Say hello!</div>';
    return;
  }

  var html = "";
  for (var i = 0; i < messagesForPerson.length; i++) {
    var msg = messagesForPerson[i];
    var senderName = msg.from === "me" ? "Elena K." : person.name;
    var bubbleClass = msg.from === "me" ? "msg mine" : "msg";
    html += '<div class="' + bubbleClass + '">';
    html += "<b>" + escapeHtml(senderName) + "</b><br>";
    html += escapeHtml(msg.text);
    html += "<small>" + formatTimeOfDay(msg.time) + "</small>";
    html += "</div>";
  }
  messagesBox.innerHTML = html;

  messagesBox.scrollTop = messagesBox.scrollHeight;
}




document.getElementById("chatPeople").addEventListener("click", function (event) {
  var row = event.target.closest(".person");
  if (!row) {
    return;
  }
  var personId = row.getAttribute("data-person-id");
  var person = findPersonById(personId);

  if (person.isMe) {
    showToast("That's you!");
    return;
  }

  activePersonId = personId;
  renderPeopleList();
  renderConversation();
});




var chatForm = document.getElementById("chatForm");
if (chatForm) {
  chatForm.addEventListener("submit", function (event) {
    
    event.preventDefault();

    var input = document.getElementById("messageInput");
    var text = input.value.trim();
    if (text === "") {
      return;
    }

    
    if (!allMessages[activePersonId]) {
      allMessages[activePersonId] = [];
    }
    allMessages[activePersonId].push({ from: "me", text: text, time: Date.now() });
    saveAllMessages(allMessages);

    input.value = "";
    renderConversation();

 
    var personId = activePersonId;
    window.setTimeout(function () {
      sendPretendReply(personId);
    }, 1500);
  });
}

function sendPretendReply(personId) {

  var reply = PRETEND_REPLIES[Math.floor(Math.random() * PRETEND_REPLIES.length)];
  if (!allMessages[personId]) {
    allMessages[personId] = [];
  }
  allMessages[personId].push({ from: "them", text: reply, time: Date.now() });
  saveAllMessages(allMessages);

  if (personId === activePersonId) {
    renderConversation();
  }
}



document.body.addEventListener("click", function (event) {
  if (event.target.getAttribute && event.target.getAttribute("data-action") === "close-modal") {
    var modalBackdrop = document.getElementById("modal");
    if (modalBackdrop) {
      modalBackdrop.classList.remove("open");
    }
  }
});

var modalBackdropEl = document.getElementById("modal");
if (modalBackdropEl) {
  modalBackdropEl.addEventListener("click", function (event) {
    if (event.target === modalBackdropEl) {
      modalBackdropEl.classList.remove("open");
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



renderPeopleList();
renderConversation();
