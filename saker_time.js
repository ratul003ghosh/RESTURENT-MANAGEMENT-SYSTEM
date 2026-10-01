


var ACTIVE_SHIFT_KEY = "rf_active_shift"; 
var SHIFT_HISTORY_KEY = "rf_shift_history"; 
var SHIFT_STORAGE_KEY = "rf_on_shift"; 


var WEEKLY_GOAL_HOURS = 40;




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


function twoDigits(number) {
  if (number < 10) {
    return "0" + number;
  }
  return "" + number;
}


function formatClock(totalMs) {
  var totalSeconds = Math.floor(totalMs / 1000);
  var hours = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor((totalSeconds % 3600) / 60);
  var seconds = totalSeconds % 60;
  return twoDigits(hours) + "h:" + twoDigits(minutes) + "m:" + twoDigits(seconds) + "s";
}


function formatHoursMinutes(totalMs) {
  var totalMinutes = Math.round(totalMs / 60000);
  var hours = Math.floor(totalMinutes / 60);
  var minutes = totalMinutes % 60;
  return hours + "h " + twoDigits(minutes) + "m";
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
  return hour12 + ":" + twoDigits(minutes) + " " + ampm;
}


function formatShortDate(timestampMs) {
  var date = new Date(timestampMs);
  var weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return weekdayNames[date.getDay()] + ", " + monthNames[date.getMonth()] + " " + date.getDate();
}


function formatFullDate(timestampMs) {
  var date = new Date(timestampMs);
  var weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return weekdayNames[date.getDay()] + ", " + monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}


function getActiveShiftStart() {
  var text = localStorage.getItem(ACTIVE_SHIFT_KEY);
  if (!text) {
    return null;
  }
  return Number(text);
}

function setActiveShiftStart(timestampMsOrNull) {
  if (timestampMsOrNull === null) {
    localStorage.removeItem(ACTIVE_SHIFT_KEY);
  } else {
    localStorage.setItem(ACTIVE_SHIFT_KEY, "" + timestampMsOrNull);
  }
}

function loadShiftHistory() {
  var text = localStorage.getItem(SHIFT_HISTORY_KEY);
  if (!text) {
    return [];
  }
  return JSON.parse(text);
}

function saveShiftHistory(historyList) {
  localStorage.setItem(SHIFT_HISTORY_KEY, JSON.stringify(historyList));
}



function renderClock() {
  var startTime = getActiveShiftStart();
  var clockTimeEl = document.getElementById("clockTime");
  var clockBtn = document.getElementById("clockBtn");

  if (startTime) {
    
    var elapsedMs = Date.now() - startTime;
    clockTimeEl.textContent = formatClock(elapsedMs);
    clockBtn.innerHTML = "⏹<br/>Clock Out";
    clockBtn.classList.add("stop");
  } else {
   
    clockTimeEl.textContent = "00h:00m:00s";
    clockBtn.innerHTML = "▶<br/>Clock In";
    clockBtn.classList.remove("stop");
  }

  document.getElementById("clockDate").textContent = formatFullDate(Date.now());
}



function getStartOfThisWeek() {
  var now = new Date();
  var daysSinceSunday = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  var startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceSunday);
  return startOfWeek.getTime();
}

function renderWeekSummary() {
  var startOfWeek = getStartOfThisWeek();
  var history = loadShiftHistory();


  var totalMs = 0;
  for (var i = 0; i < history.length; i++) {
    if (history[i].clockIn >= startOfWeek) {
      totalMs += history[i].durationMs;
    }
  }


  var activeStart = getActiveShiftStart();
  if (activeStart && activeStart >= startOfWeek) {
    totalMs += Date.now() - activeStart;
  }

  document.getElementById("weekHours").textContent = formatHoursMinutes(totalMs);

  var totalHours = totalMs / 3600000;
  var percent = Math.min(100, Math.round((totalHours / WEEKLY_GOAL_HOURS) * 100));
  document.getElementById("weekBar").style.width = percent + "%";
}




function renderShiftHistory() {
  var history = loadShiftHistory();
  var box = document.getElementById("shiftRows");

  if (history.length === 0) {
    box.innerHTML = '<div class="tiny" style="text-align:center;padding:14px 0">No completed shifts yet.</div>';
    return;
  }

 
  var sortedHistory = history.slice().reverse();

  var html = "";
  for (var i = 0; i < sortedHistory.length; i++) {
    var shift = sortedHistory[i];
    html += '<div class="detail-row" style="padding:8px 0;border-top:1px solid var(--border-color)">';
    html += "  <div>";
    html += "    <b>" + formatShortDate(shift.clockIn) + "</b>";
    html += '    <div class="tiny">' + formatTimeOfDay(shift.clockIn) + " – " + formatTimeOfDay(shift.clockOut) + "</div>";
    html += "  </div>";
    html += '  <b style="color:var(--accent-dark)">' + formatHoursMinutes(shift.durationMs) + "</b>";
    html += "</div>";
  }
  box.innerHTML = html;
}



function renderEverything() {
  renderClock();
  renderWeekSummary();
  renderShiftHistory();
  paintHeaderShiftChip();
}




var clockButton = document.getElementById("clockBtn");
if (clockButton) {
  clockButton.addEventListener("click", function () {
    var startTime = getActiveShiftStart();

    if (startTime) {
    
      var finishedShift = {
        clockIn: startTime,
        clockOut: Date.now(),
        durationMs: Date.now() - startTime
      };
      var history = loadShiftHistory();
      history.push(finishedShift);
      saveShiftHistory(history);

      setActiveShiftStart(null);
      localStorage.setItem(SHIFT_STORAGE_KEY, "false");
      showToast("Clocked out. Shift saved: " + formatHoursMinutes(finishedShift.durationMs) + ".");
    } else {
     
      setActiveShiftStart(Date.now());
      localStorage.setItem(SHIFT_STORAGE_KEY, "true");
      showToast("Clocked in. Have a great shift!");
    }

    renderEverything();
  });
}



var adjustButtons = document.querySelectorAll("[data-adjust]");
for (var a = 0; a < adjustButtons.length; a++) {
  adjustButtons[a].addEventListener("click", function (event) {
    var startTime = getActiveShiftStart();
    if (!startTime) {
      showToast("Clock in first before adjusting the time.");
      return;
    }
    var minutesToAdjust = Number(event.currentTarget.getAttribute("data-adjust"));


    var newStartTime = startTime - minutesToAdjust * 60000;

    
    if (newStartTime > Date.now()) {
      newStartTime = Date.now();
    }

    setActiveShiftStart(newStartTime);
    renderEverything();
  });
}

var resetShiftButton = document.getElementById("resetShift");
if (resetShiftButton) {
  resetShiftButton.addEventListener("click", function () {
    var startTime = getActiveShiftStart();
    if (!startTime) {
      showToast("There is no running shift to reset.");
      return;
    }
    var sure = window.confirm("Reset the current shift? This will not be saved.");
    if (!sure) {
      return;
    }
    setActiveShiftStart(null);
    localStorage.setItem(SHIFT_STORAGE_KEY, "false");
    showToast("Shift reset.");
    renderEverything();
  });
}




function paintHeaderShiftChip() {
  var shiftChipButton = document.getElementById("shiftChip");
  if (!shiftChipButton) {
    return;
  }
  var isOnShift = getActiveShiftStart() !== null;
  if (isOnShift) {
    shiftChipButton.textContent = "● On Shift";
    shiftChipButton.classList.add("on");
  } else {
    shiftChipButton.textContent = "● Off Shift";
    shiftChipButton.classList.remove("on");
  }
}

var shiftChipButton = document.getElementById("shiftChip");
if (shiftChipButton) {
  shiftChipButton.addEventListener("click", function () {
   
    document.getElementById("clockBtn").click();
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




renderEverything();


window.setInterval(renderEverything, 1000);
