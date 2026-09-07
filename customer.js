
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".slot:not(.disabled)").forEach(function(slot){
        slot.addEventListener("click", function(){
            document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
            slot.classList.add("selected");
        });
    });

    document.querySelectorAll(".table-select").forEach(function(card){
        card.addEventListener("click", function(){
            document.querySelectorAll(".table-select").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
        });
    });

    document.querySelectorAll("[data-modal]").forEach(function(button){
        button.addEventListener("click", function(){
            const modal = document.getElementById(button.dataset.modal);
            if(modal) modal.classList.add("show");
        });
    });

    document.querySelectorAll(".modal-close").forEach(function(button){
        button.addEventListener("click", function(){
            button.closest(".modal").classList.remove("show");
        });
    });

    document.querySelectorAll(".category-btn").forEach(function(button){
        button.addEventListener("click", function(){
            const category = button.dataset.category;
            document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("btn"));
            document.querySelectorAll(".category-btn").forEach(b => b.classList.add("btn2"));
            button.classList.remove("btn2");
            button.classList.add("btn");
            document.querySelectorAll(".food-card").forEach(function(card){
                card.style.display = (category === "all" || card.dataset.category === category) ? "" : "none";
            });
        });
    });

    const customizeForm = document.getElementById("customizeForm");
    if(customizeForm){
        customizeForm.addEventListener("submit", function(e){
            e.preventDefault();
            document.getElementById("customizeModal").classList.remove("show");
            alert("Customized item added to your order.");
        });
    }

    const chatForm = document.getElementById("chatForm");
    if(chatForm){
        chatForm.addEventListener("submit", function(e){
            e.preventDefault();
            const input = document.getElementById("chatMessage");
            if(!input.value.trim()) return;
            const msg = document.createElement("div");
            msg.className = "message customer";
            msg.textContent = input.value;
            document.querySelector(".messages").appendChild(msg);
            input.value = "";
        });
    }
    const menuSearch = document.getElementById("menuSearch");

if(menuSearch){
    menuSearch.addEventListener("input", function(){
        const searchText = menuSearch.value.toLowerCase().trim();

        document.querySelectorAll(".food-card").forEach(function(card){
            const itemName = card.querySelector(".food-name").textContent.toLowerCase();
            const itemDescription = card.querySelector(".food-desc").textContent.toLowerCase();

            if(itemName.includes(searchText) || itemDescription.includes(searchText)){
                card.style.display = "";
            }else{
                card.style.display = "none";
            }
        });
    });
}
const tables = document.querySelectorAll(".table-card.available");
    const selectedTable = document.getElementById("selectedTable");

    tables.forEach(function (table) {

        table.addEventListener("click", function () {

            // Remove selection from all available tables
            tables.forEach(function (t) {
                t.classList.remove("selected");
            });

            // Select this table
            table.classList.add("selected");

            // Show selected table name
            selectedTable.textContent = table.getAttribute("data-table");
        });

    });


    const printBtn = document.getElementById("printBill");
    if(printBtn) printBtn.addEventListener("click", () => window.print());
});
