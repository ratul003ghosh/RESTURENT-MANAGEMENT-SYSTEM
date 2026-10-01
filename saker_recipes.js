
var RECIPES_STORAGE_KEY = "rf_recipes";


var SHIFT_STORAGE_KEY = "rf_on_shift";


var CATEGORY_ORDER = ["Appetizers", "Pizza", "Drinks", "Desserts", "Burgers", "Mains"];

var RECIPE_IMAGES = {
  "Burrata & Heirloom Tomato": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=85",
  "Classic Margherita": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",
  "Cold Brew Espresso Tonic": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85",
  "Creme Brulee": "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85",
  "Bacon Cheeseburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
  "Beef Wellington": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85",
  "Herb Roasted Chicken": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85",
  "Fresh Mint Lemonade": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f8a?auto=format&fit=crop&w=900&q=85",
  "Mushroom Risotto": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=900&q=85",
  "Smash Burger Deluxe": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85",
  "Spicy Tuna Tataki": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=85",
  "Truffle Mushroom Pizza": "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85",
  "Caesar Salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85",
  "Chicken Piccata": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=85",
  "Chocolate Mousse": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85"
};


var CATEGORY_IMAGES = {
  Appetizers: RECIPE_IMAGES["Burrata & Heirloom Tomato"],
  Pizza: RECIPE_IMAGES["Classic Margherita"],
  Drinks: RECIPE_IMAGES["Fresh Mint Lemonade"],
  Desserts: RECIPE_IMAGES["Chocolate Mousse"],
  Burgers: RECIPE_IMAGES["Bacon Cheeseburger"],
  Mains: RECIPE_IMAGES["Herb Roasted Chicken"]
};


var recipeSearchText = "";
var selectedCategory = "all";


var recipeBeingEditedId = null;



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




function loadRecipesFromStorage() {
  var text = localStorage.getItem(RECIPES_STORAGE_KEY);
  if (!text) {
    return null;
  }
  return JSON.parse(text);
}

function saveRecipesToStorage(recipeList) {
  localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipeList));
}


function buildStartingRecipes() {
  return [
    { id: 1, name: "Burrata & Heirloom Tomato", category: "Appetizers", difficulty: "Easy", minutes: 6, notes: "" },
    { id: 2, name: "Classic Margherita", category: "Pizza", difficulty: "Medium", minutes: 22, notes: "" },
    { id: 3, name: "Cold Brew Espresso Tonic", category: "Drinks", difficulty: "Easy", minutes: 4, notes: "" },
    { id: 4, name: "Crème Brûlée", category: "Desserts", difficulty: "Medium", minutes: 10, notes: "" },
    { id: 5, name: "Bacon Cheeseburger", category: "Burgers", difficulty: "Medium", minutes: 15, notes: "" },
    { id: 6, name: "Beef Wellington", category: "Mains", difficulty: "Hard", minutes: 35, notes: "" },
    { id: 7, name: "Herb Roasted Chicken", category: "Mains", difficulty: "Medium", minutes: 28, notes: "" },
    { id: 8, name: "Fresh Mint Lemonade", category: "Drinks", difficulty: "Easy", minutes: 5, notes: "" },
    { id: 9, name: "Mushroom Risotto", category: "Mains", difficulty: "Hard", minutes: 20, notes: "" },
    { id: 10, name: "Smash Burger Deluxe", category: "Burgers", difficulty: "Medium", minutes: 12, notes: "" },
    { id: 11, name: "Spicy Tuna Tataki", category: "Appetizers", difficulty: "Hard", minutes: 11, notes: "" },
    { id: 12, name: "Truffle Mushroom Pizza", category: "Pizza", difficulty: "Medium", minutes: 25, notes: "" },
    { id: 13, name: "Caesar Salad", category: "Appetizers", difficulty: "Easy", minutes: 7, notes: "" },
    { id: 14, name: "Chicken Piccata", category: "Mains", difficulty: "Medium", minutes: 16, notes: "" },
    { id: 15, name: "Chocolate Mousse", category: "Desserts", difficulty: "Easy", minutes: 8, notes: "" }
  ];
}

var allRecipes = loadRecipesFromStorage();
if (!allRecipes) {
  allRecipes = buildStartingRecipes();
  saveRecipesToStorage(allRecipes);
}




function recipeMatchesFilters(recipe) {
  if (selectedCategory !== "all" && recipe.category !== selectedCategory) {
    return false;
  }
  var search = recipeSearchText.trim().toLowerCase();
  if (search === "") {
    return true;
  }
  return recipe.name.toLowerCase().indexOf(search) !== -1;
}



function renderCategoryPills() {
 
  var countsByCategory = {};
  for (var i = 0; i < allRecipes.length; i++) {
    var cat = allRecipes[i].category;
    if (!countsByCategory[cat]) {
      countsByCategory[cat] = 0;
    }
    countsByCategory[cat] = countsByCategory[cat] + 1;
  }

  var html = "";


  var allActiveClass = selectedCategory === "all" ? "pill active" : "pill";
  html += '<button class="' + allActiveClass + '" data-category="all"> All ' + allRecipes.length + "</button>";

 
  for (var c = 0; c < CATEGORY_ORDER.length; c++) {
    var name = CATEGORY_ORDER[c];
    var count = countsByCategory[name] || 0;
    if (count === 0) {
      continue;
    }
    var activeClass = selectedCategory === name ? "pill active" : "pill";
    html += '<button class="' + activeClass + '" data-category="' + name + '">' + name + " " + count + "</button>";
  }

  document.getElementById("categories").innerHTML = html;
}




function buildRecipeCardHtml(recipe) {
  var imageUrl = RECIPE_IMAGES[recipe.name] || CATEGORY_IMAGES[recipe.category] || "";


  var difficultyClass = recipe.difficulty.toLowerCase();

  var html = "";
  html += '<div class="recipe">';
  html += '  <div class="photo">';
  html += '    <div class="time"> ' + recipe.minutes + "m</div>";
  html += '    <div style="height:100%;width:100%;background-image:url(&quot;' + imageUrl + '&quot;);background-size:cover;background-position:center;"></div>';
  html += "  </div>";
  html += '  <div class="rbody">';
  html += "    <h3>" + escapeHtml(recipe.name) + "</h3>";
  html += '    <span class="tag">' + recipe.category.toUpperCase() + "</span> ";
  html += '    <span class="tag ' + difficultyClass + '">' + recipe.difficulty + "</span>";
  html += '    <div class="rfoot">';
  html += "      <span>Updated Today</span>";
  html += "      <span>";
  html += '        <button data-action="edit" data-id="' + recipe.id + '"> Edit</button>';
  html += '        <button data-action="delete" data-id="' + recipe.id + '"> Delete</button>';
  html += "      </span>";
  html += "    </div>";
  html += "  </div>";
  html += "</div>";
  return html;
}




function renderRecipes() {
  renderCategoryPills();

  document.getElementById("recipeCount").textContent = allRecipes.length;

  var visibleRecipes = [];
  for (var i = 0; i < allRecipes.length; i++) {
    if (recipeMatchesFilters(allRecipes[i])) {
      visibleRecipes.push(allRecipes[i]);
    }
  }

  var grid = document.getElementById("recipeGrid");
  if (visibleRecipes.length === 0) {
    grid.innerHTML = '<div class="empty">No recipes match your search.</div>';
    return;
  }

  var html = "";
  for (var j = 0; j < visibleRecipes.length; j++) {
    html += buildRecipeCardHtml(visibleRecipes[j]);
  }
  grid.innerHTML = html;
}




var recipeSearchInput = document.getElementById("recipeSearch");
if (recipeSearchInput) {
  recipeSearchInput.addEventListener("input", function () {
    recipeSearchText = recipeSearchInput.value;
    renderRecipes();
  });
}

document.getElementById("categories").addEventListener("click", function (event) {
  var button = event.target.closest("button");
  if (!button) {
    return;
  }
  selectedCategory = button.getAttribute("data-category");
  renderRecipes();
});




document.getElementById("recipeGrid").addEventListener("click", function (event) {
  var button = event.target.closest("button");
  if (!button) {
    return;
  }
  var action = button.getAttribute("data-action");
  var recipeId = Number(button.getAttribute("data-id"));

  if (action === "edit") {
    openRecipeForm(recipeId);
  } else if (action === "delete") {
    deleteRecipe(recipeId);
  }
});

function findRecipeById(recipeId) {
  for (var i = 0; i < allRecipes.length; i++) {
    if (allRecipes[i].id === recipeId) {
      return allRecipes[i];
    }
  }
  return null;
}

function deleteRecipe(recipeId) {
  var recipe = findRecipeById(recipeId);
  if (!recipe) {
    return;
  }

  var sure = window.confirm('Delete "' + recipe.name + '"? This cannot be undone.');
  if (!sure) {
    return;
  }

  var newList = [];
  for (var i = 0; i < allRecipes.length; i++) {
    if (allRecipes[i].id !== recipeId) {
      newList.push(allRecipes[i]);
    }
  }
  allRecipes = newList;
  saveRecipesToStorage(allRecipes);
  showToast('"' + recipe.name + '" was deleted.');
  renderRecipes();
}



function buildOptionsHtml(choices, currentValue) {
  var html = "";
  for (var i = 0; i < choices.length; i++) {
    var isSelected = choices[i] === currentValue ? " selected" : "";
    html += "<option" + isSelected + ">" + choices[i] + "</option>";
  }
  return html;
}


function openRecipeForm(recipeId) {
  var recipe = recipeId ? findRecipeById(recipeId) : null;
  recipeBeingEditedId = recipe ? recipe.id : null;

  var title = recipe ? "Edit Recipe" : "Add Recipe";
  var name = recipe ? recipe.name : "";
  var minutes = recipe ? recipe.minutes : "";
  var notes = recipe ? recipe.notes : "";
  var category = recipe ? recipe.category : CATEGORY_ORDER[0];
  var difficulty = recipe ? recipe.difficulty : "Easy";

  var html = "";
  html += '<div class="modal-head"><h2>' + title + "</h2>";
  html += '<button class="close" data-action="close-modal">×</button></div>';
  html += '<div class="form-grid">';

  html += '  <div class="field full">';
  html += "    <label>Recipe name</label>";
  html += '    <input id="rfName" value="' + escapeHtml(name) + '" placeholder="e.g. Classic Margherita">';
  html += "  </div>";

  html += '  <div class="field">';
  html += "    <label>Category</label>";
  html += '    <select id="rfCategory">' + buildOptionsHtml(CATEGORY_ORDER, category) + "</select>";
  html += "  </div>";

  html += '  <div class="field">';
  html += "    <label>Difficulty</label>";
  html += '    <select id="rfDifficulty">' + buildOptionsHtml(["Easy", "Medium", "Hard"], difficulty) + "</select>";
  html += "  </div>";

  html += '  <div class="field">';
  html += "    <label>Time (minutes)</label>";
  html += '    <input id="rfMinutes" type="number" min="1" value="' + minutes + '">';
  html += "  </div>";

  html += '  <div class="field full">';
  html += "    <label>Notes (optional)</label>";
  html += '    <textarea id="rfNotes" placeholder="Ingredients or steps...">' + escapeHtml(notes) + "</textarea>";
  html += "  </div>";

  html += "</div>"; // end form-grid

  html += '<div class="modal-actions">';
  html += '  <button class="btn" data-action="close-modal">Cancel</button>';
  html += '  <button class="btn green" id="rfSaveBtn">Save Recipe</button>';
  html += "</div>";

  openModal(html);

  document.getElementById("rfSaveBtn").addEventListener("click", saveRecipeForm);
}

function saveRecipeForm() {
  var name = document.getElementById("rfName").value.trim();
  var category = document.getElementById("rfCategory").value;
  var difficulty = document.getElementById("rfDifficulty").value;
  var minutes = Number(document.getElementById("rfMinutes").value);
  var notes = document.getElementById("rfNotes").value.trim();

  if (name === "") {
    showToast("Please give the recipe a name.");
    return;
  }
  if (!minutes || minutes < 1) {
    minutes = 5; 
  }

  if (recipeBeingEditedId) {

    var recipe = findRecipeById(recipeBeingEditedId);
    recipe.name = name;
    recipe.category = category;
    recipe.difficulty = difficulty;
    recipe.minutes = minutes;
    recipe.notes = notes;
    showToast('"' + name + '" was updated.');
  } else {
   
    var highestId = 0;
    for (var i = 0; i < allRecipes.length; i++) {
      if (allRecipes[i].id > highestId) {
        highestId = allRecipes[i].id;
      }
    }
    allRecipes.push({
      id: highestId + 1,
      name: name,
      category: category,
      difficulty: difficulty,
      minutes: minutes,
      notes: notes
    });
    showToast('"' + name + '" was added.');
  }

  saveRecipesToStorage(allRecipes);
  closeModal();
  renderRecipes();
}


var addRecipeButton = document.getElementById("addRecipeBtn");
if (addRecipeButton) {
  addRecipeButton.addEventListener("click", function () {
    openRecipeForm(null);
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




renderRecipes();
