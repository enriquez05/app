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
    logout.addEventListener("click", () => {checkUserLoginStatus()});
    updateSalesReport();
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
    const from_date = document.getElementById("from_date");
    const to_date = document.getElementById("to_date");
    const export_sale_btn = document.getElementById("export_sale_btn");

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    from_date.value = formattedDate;

    back_btn.addEventListener("click", () => {
        window.history.back();
    });

    from_date.addEventListener("change", () => {
        let from_date_value = document.getElementById("from_date").value;
        let to_date_value = document.getElementById("to_date").value;

        // Convert the date strings to Date objects
        let from_date = from_date_value ? new Date(from_date_value) : null;
        let to_date = to_date_value ? new Date(to_date_value) : null;
        
        if (from_date && to_date && from_date < to_date) {
            updateSalesReportTable(from_date_value, to_date_value, 1);
        } else if (from_date) {
            updateSalesReportTable(from_date_value, null, 2);
        } else if (!from_date_value && !to_date_value){
            updateSalesReportTable(null, null, 3);
        }
    });

    to_date.addEventListener("change", () => {
        let from_date_value = document.getElementById("from_date").value;
        let to_date_value = document.getElementById("to_date").value;

        // Convert the date strings to Date objects
        let from_date = new Date(from_date_value);
        let to_date = new Date(to_date_value);
        
        if (from_date && to_date && from_date < to_date) {
            updateSalesReportTable(from_date_value, to_date_value, 1);
        } else if (from_date) {
            updateSalesReportTable(from_date_value, null, 2);
        } else if (!from_date_value && !to_date_value){
            updateSalesReportTable(null, null, 3);
        }
    });

    export_sale_btn.addEventListener("click", () => {
        exportDataToPDF();
    });
}

async function updateSalesReport(){
    const sale_report_items_container = document.getElementById("sale_report_items_container");
    sale_report_items_container.innerHTML = "";
    currentSnapshotDisplayed = [];
    const groupedSales = new Map();

    try {
        // Query all documents in the inventory collection
        const transactionCollection = collection(fdb, "transactions");
        const transactionQuery = query(transactionCollection, where("order_itemID", "==", "hTh5A6r3FEvnRBIDtROo")); 
        const transactionSnapshot = await getDocs(transactionQuery);
        currentSnapshot = transactionSnapshot;
        
        if (!transactionSnapshot.empty) {
            transactionSnapshot.forEach((doc) => {
                const data = doc.data();
                const dataDate = new Date(data.order_dateOrdered);
                dataDate.setHours(0, 0, 0, 0);

                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);

                let isWithinRange = false; 
                if(dataDate.getTime() === todayDate.getTime()){
                    isWithinRange = true;
                }
                
                if (isWithinRange) {
                    if (groupedSales.has(data.order_dateOrdered)) {
                        // Update total price for the existing date
                        const existingData = groupedSales.get(data.order_dateOrdered);
                        existingData.order_totalPrice += data.order_totalPrice;
                        console.log("existingData.order_totalPrice: ",existingData.order_totalPrice);
                    } else {
                        // Add new entry for this date
                        groupedSales.set(data.order_dateOrdered, {
                            order_dateOrdered: data.order_dateOrdered,
                            order_totalPrice: data.order_totalPrice,
                        });
                        console.log("data.order_totalPrice: ",data.order_totalPrice);
                    }
                }
            });
            for (const [key, value] of groupedSales) {
                currentSnapshotDisplayed.push(value);
                appendReportItem(value, sale_report_items_container);
            }
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

function updateSalesReportTable(from_date_value, to_date_value, flag){
    console.trace("updateSalesReportTable is called");
    const sale_report_items_container = document.getElementById("sale_report_items_container");
    sale_report_items_container.innerHTML = "";
    currentSnapshotDisplayed = [];
    const groupedSales = new Map(); 

    try {
        if (!currentSnapshot.empty) {
            currentSnapshot.forEach((doc) => {
                const data = doc.data();
                const dataDate = new Date(data.order_dateOrdered);
                dataDate.setHours(0, 0, 0, 0);

                let isWithinRange = true; 
                if(flag === 1){
                    let from_date = new Date(from_date_value);
                    let to_date = new Date(to_date_value);
                    from_date.setHours(0, 0, 0, 0);
                    to_date.setHours(0, 0, 0, 0);
                    isWithinRange = dataDate >= from_date && dataDate <= to_date;
                } else if(flag === 2){
                    let from_date = new Date(from_date_value);
                    from_date.setHours(0, 0, 0, 0);
                    isWithinRange = dataDate >= from_date;
                } 

                if (isWithinRange) {
                    if (groupedSales.has(data.order_dateOrdered)) {
                        // Update total price for the existing date
                        const existingData = groupedSales.get(data.order_dateOrdered);
                        existingData.order_totalPrice += data.order_totalPrice;
                        console.log("existingData.order_totalPrice: ",existingData.order_totalPrice);
                    } else {
                        // Add new entry for this date
                        groupedSales.set(data.order_dateOrdered, {
                            order_dateOrdered: data.order_dateOrdered,
                            order_totalPrice: data.order_totalPrice,
                        });
                        console.log("data.order_totalPrice: ",data.order_totalPrice);
                    }
                }
            });
            for (const [key, value] of groupedSales) {
                currentSnapshotDisplayed.push(value);
                appendReportItem(value, sale_report_items_container);
            }
            console.log("currentSnapshotDisplayed: ",currentSnapshotDisplayed);
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
    itemDiv.classList.add(`report-item-container`);

    itemDiv.innerHTML = `
        <div class="report-item-date-value">
            <p>${data.order_dateOrdered || "N/A"}</p>
        </div>
        <div class="report-item-sale-value">
            <p>₱${data.order_totalPrice || "N/A"}</p>
        </div>
    `;
    container.appendChild(itemDiv);
}

function exportDataToPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add receipt title
    doc.setFontSize(18);
    doc.text("DAILY SALES REPORT", 105, 20, { align: "center" });

    // Add table headers
    doc.setFontSize(12);
    let startY = 40;
    doc.text("Date", 20, startY);
    doc.text("Total Price (P)", 100, startY);

    // Add a horizontal line for headers
    doc.line(20, startY + 2, 190, startY + 2);

    // Add the data
    startY += 10; // Move down for the first row
    currentSnapshotDisplayed.forEach((data, index) => {
        doc.text(data.order_dateOrdered || "N/A", 20, startY);
        doc.text(`P ${data.order_totalPrice || "N/A"}`, 100, startY);
        startY += 10; // Move down for the next row

        // Add a new page if necessary
        if (startY > 280) { 
            doc.addPage();
            startY = 20; 
        }
    });


    // Save the PDF
    let today = new Date();
    doc.save(`DailySales_${today}.pdf`);
}