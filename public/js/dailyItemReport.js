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
let currentSnapshotDisplayed = null;

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    const currentItem = document.getElementById("currentItem");
    const current_date = document.getElementById("current_date");

    logout.addEventListener("click", () => {checkUserLoginStatus()});
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    current_date.textContent = `DATE: ${month}/${day}/${year}`;
    
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

    back_btn.addEventListener("click", () => {
        window.location.href = '../html/inventory.html';
    });

    searchbar.addEventListener("input", () => {
        let searchTearm = document.getElementById("searchbar").value;
        updateSalesReportTable(searchTearm);
    });

    current_date.addEventListener("change", () => {
        let inputDate = document.getElementById("current_date").value;

        if (inputDate){
            const date = new Date(inputDate);

            // Extract components
            const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
    
            // Format to mm/dd/yyyy
            const formattedDate = `${month}/${day}/${year}`;
            console.log(formattedDate);
            updateSalesReportTable(formattedDate);
        } else {
            updateSalesReportTable("");
        }
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
                const dataDate = data.order_dateOrdered.toLowerCase();
                const searchTermLower = searchTearm.toLowerCase(); 

                // Check for partial match
                if (dataName.includes(searchTermLower) || dataDate.includes(searchTermLower)) {
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
