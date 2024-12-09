import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDoc,
    getDocs,
    doc,
    collection,
    addDoc,
} from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    const back_btn1 = document.getElementById("back_btn1");
    const back_btn2 = document.getElementById("back_btn2");
    logout.addEventListener("click", () => {logoutUser()});
    back_btn1.addEventListener("click", () => {window.location.href="/html/transaction.html"});
    back_btn2.addEventListener("click", () => {window.location.href="/html/transaction.html"});
    checkUserLoginStatus();
    retrieveOrderDetails();
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
            auth.signOut()
            console.log("User not logged in.");
            window.location.href = '../html/login.html'; 
        }
    });
}

function retrieveOrderDetails(){
    const urlParams = new URLSearchParams(window.location.search);
    const orderDetailsString = urlParams.get("orderDetails");
    let orderDetails = null;

    if (orderDetailsString) {
        orderDetails = JSON.parse(decodeURIComponent(orderDetailsString));
        console.log("Retrieved orderDetails:", orderDetails);
    }

    // payment form
    const total = document.getElementById("total");
    const pvalue = document.getElementById("pvalue");
    const change1 = document.getElementById("change1");
    const pay_btn = document.getElementById("pay_btn");

    let totalPrice = orderDetails.order_totalPrice.toFixed(2);
    let currentChange = 0;
    let currentPaymentValue = 0;
    total.value = totalPrice

    pvalue.addEventListener("input", () => {
        currentPaymentValue = document.getElementById("pvalue").value;
        currentChange = currentPaymentValue - totalPrice;
        change1.value = currentChange;
    });

    pay_btn.addEventListener("click", async () => {
        const payment_method = document.getElementById("payment_method");
        const paymentValue = parseFloat(currentPaymentValue);
        const priceValue = parseFloat(totalPrice);

        if (paymentValue >= priceValue){
            const transactionCollection = collection(fdb, "transactions");
            orderDetails.order_paymentChange = currentChange;
            orderDetails.order_paymentMethod = payment_method.value;
            orderDetails.order_paymentValue = paymentValue;
            
            // Get the current date and time
            const now = new Date();
    
            // Format the date as DD/MM/YYYY
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            orderDetails.order_dateOrdered = `${month}/${day}/${year}`;
    
            // Format the time as HH:mm:ss (24-hour format)
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            orderDetails.order_timeOrdered = `${hours}:${minutes}:${seconds}`;

            // Add the orderDetails to Firestore
            addDoc(transactionCollection, orderDetails)
                .then((docRef) => {
                    console.log("Transaction added with ID:", docRef.id);
                    // call function for popup success modal
                    showSuccessModal(orderDetails, docRef.id);
                })
                .catch((error) => {
                    Swal.fire({
                        title: 'Error!',
                        text: `Error adding transaction: ${error}`,
                        icon: 'error',
                        confirmButtonText: 'OK',
                    }).then((result) => {
                        if (result.isConfirmed) {
                            console.error("Error adding transaction:", error);
                        }
                    });
                });
        }
        console.log("orderDetails:", orderDetails);
    });
}

function showSuccessModal(orderDetails, id){
    const payment_container = document.getElementById("payment_container");
    const payment_modal = document.getElementById("payment_modal");
    const print_receipt = document.getElementById("print_receipt");

    payment_container.style.display = 'none';
    payment_modal.style.display = 'flex';

    print_receipt.addEventListener("click", () => {
        // create a pdf file with the order details and the order id
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add receipt title
        doc.setFontSize(18);
        doc.text("Receipt", 105, 20, { align: "center" });

        // Add Order ID
        doc.setFontSize(12);
        doc.text(`Order ID: ${id}`, 20, 40);

        // Add Order Details
        doc.text("Order Details:", 20, 50);
        let y = 60; // Start position for order details
        orderDetails.order_list.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.currentWeight}g - P${item.currentTotalPrice}`, 20, y);
            y += 10;
        });

        // Add Total Price
        doc.text(`Total Price: P${orderDetails.order_paymentValue}`, 20, y + 10);

        // Add Payment Method
        doc.text(`Payment Method: ${orderDetails.order_paymentMethod}`, 20, y + 20);

        // Add Footer (Date and Time)
        doc.setFontSize(10);
        const now = new Date();
        doc.text(`Date: ${orderDetails.order_dateOrdered}`, 20, y + 40);
        doc.text(`Time: ${orderDetails.order_timeOrdered}`, 20, y + 50);

        // Save the PDF
        doc.save(`Receipt_${id}.pdf`);
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