var CHEF_API_BASE = "api/";

async function chefApiCheckSession() {
  try {
    var result = await chefApiRequest("chef_auth.php");
    var name = document.getElementById("menuChef");
    var avatar = document.getElementById("avatarBtn");
    if (name) name.textContent = result.chef.name;
    if (avatar) avatar.textContent = result.chef.name.charAt(0).toUpperCase();
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      window.location.replace("chef_login.html");
    } else {
      chefApiShowError(error);
    }
  }
}

async function chefApiRequest(endpoint, options) {
  var response;
  try {
    response = await fetch(CHEF_API_BASE + endpoint, options || {
      headers: { Accept: "application/json" }
    });
  } catch (error) {
    throw new Error("Could not reach the server. Make sure Apache and MySQL are running.");
  }

  var result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !result || result.success !== true) {
    var requestError = new Error(result && result.message ? result.message : "The request failed.");
    requestError.status = response.status;
    throw requestError;
  }
  return result;
}

function chefApiPost(endpoint, body) {
  return chefApiRequest(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function chefApiShowError(error) {
  var message = error && error.message ? error.message : "The request failed.";
  if (typeof showToast === "function") {
    showToast(message);
  } else {
    window.alert(message);
  }
}

function chefApiPaintShift(activeStart) {
  var shiftChip = document.getElementById("shiftChip");
  if (!shiftChip) return;

  var isOnShift = activeStart !== null && activeStart !== undefined;
  shiftChip.textContent = isOnShift ? "● On Shift" : "● Off Shift";
  shiftChip.classList.toggle("on", isOnShift);
}

async function chefApiRefreshShift() {
  try {
    var result = await chefApiRequest("chef_attendance.php");
    chefApiPaintShift(result.active_start);
    return result;
  } catch (error) {
    chefApiShowError(error);
    return null;
  }
}

var chefShiftChip = document.getElementById("shiftChip");
if (chefShiftChip) {
  chefApiCheckSession();
  chefApiRefreshShift();
  chefShiftChip.addEventListener("click", function () {
    if (document.getElementById("clockBtn")) {
      document.getElementById("clockBtn").click();
    } else {
      window.location.href = "saker_time.html";
    }
  });
}
