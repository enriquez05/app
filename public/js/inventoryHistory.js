import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    fdb,
    getDocs,
    getDoc,
    doc,
    collection,
    query,
    where,
} from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", function() {
    const logout = document.getElementById("logout");
    const selectedTimeframe = document.getElementById("selectedTimeframe").textContent.trim();
    logout.addEventListener("click", () => {logoutUser()});
    checkUserLoginStatus();
    console.log("selectedTimeframe: "+selectedTimeframe);
    populateGraphs(selectedTimeframe);
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

async function populateGraphs(selectedTimeframe) {
    const graphsContainer = document.getElementById("graphsContainer");

    // Fetch and process data
    const inventoryItems = await fetchInventoryAndTransactions();

    // Clear existing graphs
    graphsContainer.innerHTML = "";

    // Create and render graphs dynamically
    Object.keys(inventoryItems).forEach((itemId, index) => {
        const item = inventoryItems[itemId];
        const totalPurchases = item.totalPurchases;
        const graphContainerId = `graph${index + 1}`;
        const graphContainer = createGraphContainer(graphContainerId, item.name);

        graphsContainer.appendChild(graphContainer);
        const chartData = prepareChartData(totalPurchases, selectedTimeframe);
        renderGraph(graphContainerId, chartData.labels, chartData.salesCount);
    });
}   

function createGraphContainer(containerId, title) {
    const container = document.createElement("div");
    container.classList.add("graph-container");
  
    container.innerHTML = `
      <div class="graph">
        <canvas id="${containerId}"></canvas>
      </div>
      <div class="graph-title">
        <p>${title}</p>
      </div>
    `;
  
    return container;
}


async function fetchInventoryAndTransactions() {
    const inventoryCollection = collection(fdb, "inventory");
    const transactionCollection = collection(fdb, "transactions");
  
    // Fetch all inventory items
    const inventorySnapshot = await getDocs(inventoryCollection);
    const inventoryItems = {};
    inventorySnapshot.forEach((doc) => {
      const data = doc.data();
      inventoryItems[data.item_id] = {
        name: data.item_name,
        totalPurchases: [],
      };
    });
    console.log("Inventory Items:", inventoryItems);
  
    // Fetch all transactions
    const transactionSnapshot = await getDocs(transactionCollection);
    transactionSnapshot.forEach((doc) => {
        const data = doc.data();
        const itemId = data.order_itemID;
        const orderDate = data.order_dateOrdered;   
  
        // Match transaction items with inventory
        if (inventoryItems[itemId]) {
            inventoryItems[itemId].totalPurchases.push(orderDate);
        }
    });
  
    return inventoryItems;
  }

function renderGraph(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
                datasets: [
                {
                    label: "Total Purchases",
                    data: data,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

// Function to get the last 7 days from today
function getLast7Days() {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(formatDate(date));
    }
    //console.log("Last 7 days:", dates);
    return dates;
}

// Function to format the date to 'DD/MM/YYYY'
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function prepareChartData(totalPurchases, selectedTimeframe){
    let labels = null;
    let salesCount = null; 

    console.log("totalPurchases: "+totalPurchases);

    switch(selectedTimeframe){
        case "Daily":
            labels = getLast7Days();
            salesCount = new Array(7).fill(0);
            labels.forEach((label, index) => {
                const count = totalPurchases.filter(purchase => purchase === label).length;
                salesCount[index] += count;
            });
            break;
        case "Weekly":
            labels = ['WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4'];
            salesCount = new Array(4).fill(0);
            totalPurchases.forEach((puchaseDate) => {
                const [day, month, year] = puchaseDate.split('/').map(Number);
                const date = new Date(year, month - 1, day); 
                const today = new Date();

                const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                const daysInMonth = date.getDate();
                const weekNumber = Math.floor((daysInMonth - 1) / 7) + 1;

                if (date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear()) {
                    console.log("buffer.");
                } else {
                    salesCount[weekNumber] += 1;
                }
            });
            break;
        case "Monthly":
            labels = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
            salesCount = new Array(12).fill(0);
            totalPurchases.forEach((puchaseDate) => {
                const [day, month, year] = puchaseDate.split('/').map(Number);
                const today = new Date();
                const currentYear = today.getFullYear();

                if (year === currentYear) {
                    salesCount[month - 1] += 1;
                } 
            });
            break;
        case "Annual":
            const currentYear = new Date().getFullYear();
            labels = [];
            for (let i = 0; i < 7; i++) {
                labels.push(currentYear - i);
            }
            labels.sort((a, b) => a - b);
            salesCount = new Array(7).fill(0);

            labels.forEach((year, index) => {
                const count = totalPurchases.filter((purchase) => {
                    const [day, month, yearFromPurchase] = purchase.split('/').map(Number);
                    return yearFromPurchase === year;  
                }).length;
                salesCount[index] += count;
            });
            break;
    }
    
    return {labels, salesCount};
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