import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
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
    logout.addEventListener("click", () => {logoutUser()});
    checkUserLoginStatus();
    updateSalesReport();
    addEventListeners();
});

function checkUserLoginStatus() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // Fetch user role from Firestore
                const userDocRef = doc(fdb, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const role = userDoc.data().role;
                    console.log("role: "+role);

                    // Redirect or validate based on role
                    if (role === "ADMIN") {
                        const transaction_option = document.getElementById("transaction_option");
                        transaction_option.style.display = 'none';
                    }
                } else {
                    console.error("No user data found.");
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            }
        } else {
            console.log("User not logged in.");
        }
    });
}

function logoutUser(){
    auth.signOut()
    .then(() => {
        console.log('User logged out successfully');
        window.location.href = '../html/login.html'; 
    })
    .catch((error) => {
        console.error('Error logging out:', error);
    });
}

function addEventListeners(){
    const from_date = document.getElementById("from_date");
    const to_date = document.getElementById("to_date");
    const export_sale_btn = document.getElementById("export_sale_btn");
    const daily_item_report_btn = document.getElementById("daily_item_report_btn");

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

    daily_item_report_btn.addEventListener("click", () => {
        window.location.href = '../html/daily_sales_report.html';
    });
}

async function updateSalesReport(){
    const sale_report_items_container = document.getElementById("sale_report_items_container");
    sale_report_items_container.innerHTML = "";
    currentSnapshotDisplayed = [];

    try {
        // Query all documents in the inventory collection
        const transactionCollection = collection(fdb, "transactions");
        const transactionQuery = query(transactionCollection, where("order_itemID", "==", "hTh5A6r3FEvnRBIDtROo")); 
        const transactionSnapshot = await getDocs(transactionQuery);
        currentSnapshot = transactionSnapshot;
        
        if (!transactionSnapshot.empty) {
            transactionSnapshot.forEach((doc) => {
                const data = doc.data();
                currentSnapshotDisplayed.push(data);
                appendReportItem(data, sale_report_items_container);
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

function updateSalesReportTable(from_date_value, to_date_value, flag){
    console.trace("updateSalesReportTable is called");
    const sale_report_items_container = document.getElementById("sale_report_items_container");
    sale_report_items_container.innerHTML = "";
    currentSnapshotDisplayed = [];

    try {
        if (!currentSnapshot.empty) {
            currentSnapshot.forEach((doc) => {
                const data = doc.data();
                const dataDate = new Date(data.order_dateOrdered);

                if(flag === 1){
                    let from_date = new Date(from_date_value);
                    let to_date = new Date(to_date_value);
                    from_date.setHours(0, 0, 0, 0);
                    to_date.setHours(0, 0, 0, 0);
                    dataDate.setHours(0, 0, 0, 0);

                    if (dataDate >= from_date && dataDate <= to_date) {
                        currentSnapshotDisplayed.push(data);
                        appendReportItem(data, sale_report_items_container);
                    }
                } else if(flag === 2){
                    let from_date = new Date(from_date_value);
                    from_date.setHours(0, 0, 0, 0);
                    dataDate.setHours(0, 0, 0, 0);

                    if (dataDate >= from_date) {
                        currentSnapshotDisplayed.push(data);
                        appendReportItem(data, sale_report_items_container);
                    }
                } else {
                    currentSnapshotDisplayed.push(data);
                    appendReportItem(data, sale_report_items_container);
                }
            });
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
            <p>${data.order_timeOrdered || "N/A"}</p>
        </div>
        <div class="report-item-sale-value">
            <p>${data.order_paymentMethod || "N/A"}</p>
        </div>
        <div class="report-item-sale-value">
            <p>${data.order_weight || "N/A"} g</p>
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
    doc.text("SALES TRANSACTION", 105, 20, { align: "center" });

    // Add table headers
    doc.setFontSize(12);
    let startY = 40;
    doc.text("DATE", 20, startY);
    doc.text("TIME", 50, startY);
    doc.text("MOP", 80, startY);
    doc.text("WEIGHT (g)", 110, startY);
    doc.text("PRICE", 150, startY);

    // Add a horizontal line for headers
    doc.line(20, startY + 2, 190, startY + 2);

    // Add the data
    startY += 10; // Move down for the first row
    currentSnapshotDisplayed.forEach((data, index) => {
        doc.text(data.order_dateOrdered || "N/A", 20, startY);
        doc.text(`${data.order_timeOrdered || "N/A"}`, 50, startY);
        doc.text(`${data.order_paymentMethod || "N/A"}`, 80, startY);
        doc.text(`${data.order_weight || "N/A"} g`, 110, startY);
        doc.text(`P ${data.order_totalPrice || "N/A"}`, 150, startY);
        startY += 10; // Move down for the next row

        // Add a new page if necessary
        if (startY > 280) { 
            doc.addPage();
            startY = 20; 
        }
    });


    // Save the PDF
    let today = new Date();
    doc.save(`Transaction_${today}.pdf`);
}