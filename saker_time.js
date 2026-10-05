


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


var activeShiftStart = null;
var shiftHistory = [];

function getActiveShiftStart() {
  return activeShiftStart;
}

function loadShiftHistory() {
  return shiftHistory;
}

async function refreshAttendanceFromApi() {
  try {
    var result = await chefApiRequest("chef_attendance.php");
    activeShiftStart = result.active_start;
    shiftHistory = result.shifts;
    chefApiPaintShift(activeShiftStart);
    renderEverything();
    return true;
  } catch (error) {
    chefApiShowError(error);
    return false;
  }
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
  clockButton.addEventListener("click", async function () {
    var startTime = getActiveShiftStart();
    try {
      await chefApiPost("chef_attendance.php", {
        action: startTime ? "clock_out" : "clock_in"
      });
      if (!(await refreshAttendanceFromApi())) return;
      showToast(startTime ? "Clocked out. Shift saved." : "Clocked in. Have a great shift!");
    } catch (error) {
      chefApiShowError(error);
    }
  });
}

function paintHeaderShiftChip() {
  chefApiPaintShift(getActiveShiftStart());
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
refreshAttendanceFromApi();


window.setInterval(renderEverything, 1000);
