// Helper function to show toast notifications
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 ${
    isError ? "bg-red-500" : "bg-green-500"
  } text-white`;
  toast.style.transform = "translateY(0)";
  setTimeout(() => {
    toast.style.transform = "translateY(100%)";
  }, 3000);
}

// Fetch and update balance
async function updateBalance() {
  try {
    const response = await fetch("/balance");
    const data = await response.json();
    document.getElementById("balance").textContent = `${data.balance.toFixed(
      2
    )} coins`;
  } catch (error) {
    showToast("Failed to fetch balance", true);
  }
}

// Fetch and update pending transactions
async function updateTransactions() {
  try {
    const response = await fetch("/transactions");
    const transactions = await response.json();
    const transactionsList = document.getElementById("transactionsList");

    if (transactions.length === 0) {
      transactionsList.innerHTML =
        '<p class="text-gray-500">No pending transactions</p>';
      return;
    }

    transactionsList.innerHTML = transactions
      .map(
        (tx) => `
            <div class="border-l-4 border-indigo-500 pl-4 py-2">
                <p class="font-medium">From: ${tx.sender}</p>
                <p class="font-medium">To: ${tx.recipient}</p>
                <p class="text-indigo-600 font-bold">${tx.amount} coins</p>
            </div>
        `
      )
      .join("");
  } catch (error) {
    showToast("Failed to fetch transactions", true);
  }
}

// Fetch and update blockchain
async function updateBlockchain() {
  try {
    const response = await fetch("/chain");
    const chain = await response.json();
    const blockchainList = document.getElementById("blockchainList");

    blockchainList.innerHTML = chain
      .map(
        (block, index) => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold">Block #${block.index}</span>
                    <span class="text-sm text-gray-500">Hash: ${block.hash.slice(
                      0,
                      16
                    )}...</span>
                </div>
                <div class="space-y-2">
                    ${block.transactions
                      .map(
                        (tx) => `
                        <div class="bg-gray-50 p-2 rounded">
                            <p class="text-sm">From: ${tx.sender}</p>
                            <p class="text-sm">To: ${tx.recipient}</p>
                            <p class="text-sm font-bold">${tx.amount} coins</p>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    showToast("Failed to fetch blockchain", true);
  }
}

// Handle transaction form submission
document
  .getElementById("transactionForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const recipient = document.getElementById("recipient").value;
    const amount = parseFloat(document.getElementById("amount").value);

    try {
      const response = await fetch("/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient, amount }),
      });
      const data = await response.json();

      if (response.ok) {
        showToast(data.message);
        document.getElementById("transactionForm").reset();
        updateTransactions();
        updateBalance();
      } else {
        showToast(data.message, true);
      }
    } catch (error) {
      showToast("Failed to create transaction", true);
    }
  });

// Handle mining
document.getElementById("mineButton").addEventListener("click", async () => {
  try {
    const response = await fetch("/mine", { method: "POST" });
    const data = await response.json();

    if (response.ok) {
      showToast(data.message);
      updateBlockchain();
      updateTransactions();
      updateBalance();
    } else {
      showToast(data.message, true);
    }
  } catch (error) {
    showToast("Mining failed", true);
  }
});

// Initial load
updateBalance();
updateTransactions();
updateBlockchain();

// Refresh data every 10 seconds
setInterval(() => {
  updateBalance();
  updateTransactions();
  updateBlockchain();
}, 10000);
