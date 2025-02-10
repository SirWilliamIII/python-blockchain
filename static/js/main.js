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
    const balanceElement = document.getElementById("balance");
    const messageElement = document.getElementById("zeroBalanceMessage");

    balanceElement.textContent = `${data.balance.toFixed(2)} coins`;

    // Show/hide the message based on balance
    if (data.balance === 0) {
      messageElement.classList.remove("hidden");
    } else {
      messageElement.classList.add("hidden");
    }
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
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="font-bold">Block #${block.index}</span>
                        <div class="text-sm text-gray-500">
                            <span class="font-medium">Proof of Work:</span> ${
                              block.proof
                            }
                            <span class="ml-2 cursor-help" title="Number of iterations needed to find a valid proof">ℹ️</span>
                        </div>
                    </div>
                    <div class="text-sm">
                        <div class="text-gray-500">Hash: ${block.hash.slice(
                          0,
                          16
                        )}...</div>
                        <div class="text-gray-500">Previous: ${
                          block.previous_hash.slice(0, 16) || "Genesis"
                        }</div>
                    </div>
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

// Add these functions
async function updateBlockSelector() {
  try {
    const response = await fetch("/chain");
    const chain = await response.json();
    const selector = document.getElementById("blockSelector");

    // Clear existing options
    selector.innerHTML = '<option value="">Select a block...</option>';

    // Add options for each block
    chain.forEach((block, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `Block #${block.index}`;
      selector.appendChild(option);
    });
  } catch (error) {
    showToast("Failed to load blocks", true);
  }
}

async function showBlockHashDetails(blockIndex) {
  try {
    const [hashResponse, attemptsResponse] = await Promise.all([
      fetch(`/block/${blockIndex}/hash`),
      fetch(`/block/${blockIndex}/pow-attempts`),
    ]);

    const details = await hashResponse.json();
    const attempts = await attemptsResponse.json();

    // Show formatted JSON input
    document.getElementById("blockData").textContent = JSON.stringify(
      JSON.parse(details.input),
      null,
      2
    );

    // Show resulting hash
    document.getElementById("blockHash").textContent = details.hash;

    // Show proof of work
    document.getElementById("proofValue").textContent = JSON.parse(
      details.input
    ).proof;

    // Show proof of work attempts
    const attemptsDiv = document.getElementById("powAttempts");
    attemptsDiv.innerHTML = attempts
      .map(
        (attempt, index) => `
      <div class="flex items-center gap-2 ${
        attempt.valid ? "text-green-600" : "text-gray-600"
      }">
        <span class="font-mono">${index + 1}.</span>
        <span class="font-mono">Nonce: ${attempt.proof}</span>
        <span class="font-mono">→</span>
        <span class="font-mono">${attempt.hash.slice(0, 16)}...</span>
        ${
          attempt.valid
            ? '<span class="text-green-600 font-semibold">(Valid!)</span>'
            : ""
        }
      </div>
    `
      )
      .join("");
  } catch (error) {
    showToast("Failed to load block details", true);
  }
}

// Add event listener for block selection
document.getElementById("blockSelector").addEventListener("change", (e) => {
  const selectedIndex = e.target.value;
  if (selectedIndex !== "") {
    showBlockHashDetails(selectedIndex);
  } else {
    document.getElementById("blockData").textContent = "";
    document.getElementById("blockHash").textContent = "";
  }
});

// Update the initial load section to include the block selector
// Initial load
updateBalance();
updateTransactions();
updateBlockchain();
updateBlockSelector();

// Refresh data every 10 seconds
setInterval(() => {
  updateBalance();
  updateTransactions();
  updateBlockchain();
  updateBlockSelector();
}, 10000);
