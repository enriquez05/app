import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDocs,
    doc,
    where,
    collection,
    query,
} from "./firebaseConfig.js";

let currentSnapshot = null;

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    const currentItem = document.getElementById("currentItem");
    logout.addEventListener("click", () => {checkUserLoginStatus()});
    updateSalesReport(currentItem.textContent.trim());
    addEventListeners();
});

function checkUserLoginStatus(){
    auth.signOut()
    .then(() => {
        console.log('User logged out successfully');
        sessionStorage.clear(); 
        localStorage.clear();
        auth.currentUser = null;
        window.location.href = '../html/login.html'; 
    })
    .catch((error) => {
        console.error('Error logging out:', error);
    });
}

function addEventListeners(){
    const back_btn = document.getElementById("back_btn");
    const current_date = document.getElementById("current_date");
    const searchbar = document.getElementById("searchbar");

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    current_date.value = formattedDate;

    back_btn.addEventListener("click", () => {
        window.location.href = '../html/inventory.html';
    });

    searchbar.addEventListener("input", () => {
        let searchTearm = document.getElementById("searchbar").value;
        updateSalesReportTable(searchTearm);
    });
}

async function updateSalesReport(mode){
    const daily_report_container = document.getElementById("daily_report_container");
    daily_report_container.innerHTML = "";

    try {
        // Query all documents in the inventory collection
        const transactionCollection = collection(fdb, "transactions");
        let transactionQuery = null;
        let transactionSnapshot = null;

        if(mode === "UTENSILS"){
            transactionQuery = query(transactionCollection, where("order_itemType", "==", "UTENSILS")); 
            transactionSnapshot = await getDocs(transactionQuery);
            currentSnapshot = transactionSnapshot;
        } else {
            transactionQuery = query(transactionCollection, where("order_itemType", "==", "TOPPINGS")); 
            transactionSnapshot = await getDocs(transactionQuery);
            currentSnapshot = transactionSnapshot;
        }
        
        if (!transactionSnapshot.empty) {
            transactionSnapshot.forEach((doc) => {
                const data = doc.data();
                appendReportItem(data, daily_report_container);
            });
        } else {
            Swal.fire({
                title: "No Data",
                text: "No transactions found.",
                icon: "info",
                confirmButtonText: "OK",
            });
        }
    } catch (error) {
        console.error("Error retrieving transactions data: ", error);
        Swal.fire({
            title: "Error!",
            text: `Error retrieving transactions items: ${error.message}`,
            icon: "error",
            confirmButtonText: "OK",
        });
    }
}

function updateSalesReportTable(searchTearm){
    console.trace("updateSalesReportTable is called");
    const daily_report_container = document.getElementById("daily_report_container");
    daily_report_container.innerHTML = "";

    try {
        if (!currentSnapshot.empty) {
            currentSnapshot.forEach((doc) => {
                const data = doc.data();
                const dataName = data.order_itemName.toLowerCase();
                const searchTermLower = searchTearm.toLowerCase(); 

                // Check for partial match
                if (dataName.includes(searchTermLower)) {
                    appendReportItem(data, daily_report_container);
                }
            });
        } else {
            Swal.fire({
                title: "No Data",
                text: "No transactions found.",
                icon: "info",
                confirmButtonText: "OK",
            });
        }
    } catch (error) {
        console.error("Error retrieving transactions data: ", error);
        Swal.fire({
            title: "Error!",
            text: `Error retrieving transactions items: ${error.message}`,
            icon: "error",
            confirmButtonText: "OK",
        });
    }
}

function appendReportItem(data, container) {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add(`row-1`);

    itemDiv.innerHTML = `
        <div class="date_container">
            <p>${data.order_dateOrdered || "N/A"}</p>
        </div>
        <div class="item_container">
            <p>${data.order_itemName || "N/A"}</p>
        </div>
        <div class="sold_container">
            <p>${data.order_weight || "N/A"} g</p>
        </div>
        <div class="tr_container">
            <p>₱${data.order_totalPrice || "N/A"}</p>
        </div>
    `;
    container.appendChild(itemDiv);
}
