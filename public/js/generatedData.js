import {
    auth,
    onAuthStateChanged,
    fdb,
    getDoc,
    getDocs,
    doc,
    collection,
    updateDoc,
    addDoc,
    query,
    orderBy,
    deleteDoc,
    where,
} from "./firebaseConfig.js";


// document.getElementById("generate_random_data").addEventListener("click", async () => {
//     let docIDs = [
//         { id: "cWmCljtxP9yOWsh09rgX", name: "Biscoff", price: 1 },
//         { id: "0sEXnDGJn7CcSl0tEafu", name: "Crushed Graham", price: 15 },
//         { id: "vi0Gu6BOuO9Cyzej3L5t", name: "Cups", price: 1 },
//         { id: "EVEGiORDCnISQp2RHHdV", name: "Lindt", price: 1 },
//         { id: "FiqZy9fYQwLML4cWc9vB", name: "Mango", price: 5 },
//         { id: "umUJUQOFOiNAKpfnIBW2", name: "Marshmallow", price: 1 },
//         { id: "4P1BNoVoZk2fWDkQV7kq", name: "Nips", price: 1 },
//         { id: "KfR9mPInhdU9s3e2Sn0p", name: "Sprinkles", price: 2 },
//     ];

//     let transactionsPerMonth = {
//         1: 5,  2: 13, 3: 23, 4: 17, 5: 12, 6: 21,
//         7: 14, 8: 16, 9: 11, 10: 24, 11: 26, 12: 32
//     };

//     const transactionCollection = collection(fdb, "transactions");

//     for (let month = 1; month <= 12; month++) {
//         let transactionCount = transactionsPerMonth[month];

//         for (let docData of docIDs) {
//             for (let i = 0; i < transactionCount; i++) {
//                 let day = Math.floor(Math.random() * 28) + 1; // Random day (1-28 for safety)
//                 let hours = Math.floor(Math.random() * 24); // Random hour (0-23)
//                 let minutes = Math.floor(Math.random() * 60); // Random minutes (0-59)
//                 let seconds = Math.floor(Math.random() * 60); // Random seconds (0-59)

//                 let order_weight = (Math.random() * 5 + 1).toFixed(2); // Random weight (1.00 - 6.00)
//                 let order_totalPrice = parseInt(order_weight) * docData.price;

//                 let orderDetails = {
//                     order_list: [],
//                     order_itemType: 'TOPPINGS',
//                     order_dateOrdered: `${month}/${day}/2024`,
//                     order_itemID: docData.id,
//                     order_itemName: docData.name,
//                     order_paymentChange: 0,
//                     order_paymentMethod: 'inventory',
//                     order_paymentValue: 0,
//                     order_quantity: 1,
//                     order_timeOrdered: `${hours}:${minutes}:${seconds}`,
//                     order_totalPrice: order_totalPrice,
//                     order_weight: order_weight,
//                 };

                // if (docData.id === "vi0Gu6BOuO9Cyzej3L5t") {
                //     orderDetails = {
                //         order_list: [],
                //         order_itemType: 'UTENSILS',
                //         order_dateOrdered: `${month}/${day}/2024`,
                //         order_itemID: docData.id,
                //         order_itemName: docData.name,
                //         order_paymentChange: 0,
                //         order_paymentMethod: 'inventory',
                //         order_paymentValue: 0,
                //         order_quantity: 1,
                //         order_timeOrdered: `${hours}:${minutes}:${seconds}`,
                //         order_totalPrice: order_totalPrice,
                //         order_weight: order_weight,
                //     };
                // }

//                 try {
//                     await addDoc(transactionCollection, orderDetails);
//                     console.log(`Transaction added: ${docData.name} on ${orderDetails.order_dateOrdered}`);
//                 } catch (error) {
//                     console.error("Error adding transaction: ", error);
//                 }
//             }
//         }
//     }

//     alert("Random transactions generated successfully!");
// });
