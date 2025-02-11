// Add these variables at the start of your file
let currentToast = null;
let toastTimeout = null;
let isInitialLoad = true;

// Helper function to show toast notifications
function showToast(message, isError = false) {
  // Clear any existing toast and timeout
  if (currentToast) {
    currentToast.remove();
    clearTimeout(toastTimeout);
  }

  // Create toast element if it doesn't exist
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
    isError ? "bg-red-500" : "bg-green-500"
  } text-white`;

  // Show the toast
  toast.classList.remove("translate-y-full");
  currentToast = toast;

  // Hide the toast after 3 seconds
  toastTimeout = setTimeout(() => {
    if (currentToast === toast) {
      toast.classList.add("translate-y-full");
      currentToast = null;
    }
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
  const transactionsList = document.getElementById("transactionsList");

  try {
    // Show loading skeleton
    transactionsList.innerHTML = `
      <div class="animate-pulse space-y-4">
        <div class="flex items-center space-x-4">
          <div class="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    `;

    const response = await fetch("/transactions");
    const transactions = await response.json();

    // Filter transactions where user is either sender or recipient
    const relevantTransactions = transactions.filter(
      (tx) => tx.sender === currentUser || tx.recipient === currentUser
    );

    if (relevantTransactions.length === 0) {
      transactionsList.innerHTML = `
        <div class="text-gray-500 text-center py-8">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">No pending transactions</p>
          <p class="text-sm mt-1">Transactions will appear here before they're mined into blocks</p>
        </div>
      `;
      return;
    }

    transactionsList.innerHTML = relevantTransactions
      .map((tx) => {
        const isSender = tx.sender === currentUser;
        return `
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div class="flex justify-between items-start">
              <div class="space-y-1">
                <p class="text-sm text-gray-600">
                  From: <span class="font-medium text-gray-900 ${
                    isSender ? "text-indigo-600" : ""
                  }">${tx.sender}</span>
                </p>
                <p class="text-sm text-gray-600">
                  To: <span class="font-medium text-gray-900 ${
                    !isSender ? "text-indigo-600" : ""
                  }">${tx.recipient}</span>
                </p>
                <p class="text-lg font-bold ${
                  isSender ? "text-red-600" : "text-green-600"
                }">
                  ${isSender ? "-" : "+"} ${tx.amount} coins
                </p>
              </div>
              <div class="flex items-center text-yellow-600">
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm">Pending</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('<div class="h-2"></div>');
  } catch (error) {
    console.error("Error fetching transactions:", error);
    transactionsList.innerHTML = `
      <div class="text-center py-8 text-red-600">
        <p>Failed to load transactions. Please try again later.</p>
      </div>
    `;
  }
}

// Fetch and update blockchain
async function updateBlockchain() {
  try {
    const response = await fetch("/chain");
    const chain = await response.json();
    const blockchainList = document.getElementById("blockchainList");

    blockchainList.innerHTML = chain
      .map((block, index) => {
        const transactions = block.transactions
          .map((tx) => {
            if (tx.sender === "MINING") {
              // Mining reward transaction style
              return `
                <div class="bg-green-50 p-3 rounded-md border border-green-200">
                  <div class="text-green-700">
                    <span class="font-medium">From: MINING</span>
                  </div>
                  <div class="text-green-700">
                    <span class="font-medium">To: ${tx.recipient}</span>
                  </div>
                  <div class="text-green-800 font-bold">
                    ${tx.amount} coins
                  </div>
                </div>`;
            } else {
              // User transaction style
              return `
                <div class="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div class="text-blue-700">
                    <span class="font-medium">From: ${tx.sender}</span>
                  </div>
                  <div class="text-blue-700">
                    <span class="font-medium">To: ${tx.recipient}</span>
                  </div>
                  <div class="text-blue-800 font-bold">
                    ${tx.amount} coins
                  </div>
                </div>`;
            }
          })
          .join('<div class="my-2"></div>'); // Add spacing between transactions

        return `
          <div class="bg-white rounded-lg shadow-md p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-semibold">Block #${block.index}</h3>
              <div class="text-right">
                <div class="text-sm text-gray-600">
                  Hash: ${block.hash.substring(0, 15)}...
                </div>
                <div class="text-sm text-gray-600">
                  Previous: ${block.previous_hash.substring(0, 15)}...
                </div>
              </div>
            </div>
            <div class="text-gray-600 mb-4">
              Proof of Work: ${block.proof}
              <span class="ml-2 text-blue-600 cursor-pointer hover:text-blue-800" title="Mining involves finding a number (proof) that produces a hash starting with 00">
                ℹ️
              </span>
            </div>
            <div class="space-y-2">
              ${transactions}
            </div>
          </div>`;
      })
      .join('<div class="my-4"></div>'); // Add spacing between blocks
  } catch (error) {
    console.error("Error fetching blockchain:", error);
    showToast("Failed to load blockchain", true);
  }
}

// Add this function to show transaction loading state
function showTransactionLoading() {
  const submitButton = document.querySelector(
    "#transactionForm button[type='submit']"
  );
  submitButton.disabled = true;
  submitButton.innerHTML = `
    <div class="flex items-center justify-center">
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sending...
    </div>
  `;
}

// Add this function to reset the transaction button
function resetTransactionButton() {
  const submitButton = document.querySelector(
    "#transactionForm button[type='submit']"
  );
  submitButton.disabled = false;
  submitButton.innerHTML = "Send Transaction";
}

// Update the transaction form submission handler
document
  .getElementById("transactionForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const recipient = document.getElementById("recipient").value;
    const amount = parseFloat(document.getElementById("amount").value);

    try {
      showTransactionLoading();
      const response = await fetch("/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient, amount }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || "Transaction created successfully");
        document.getElementById("transactionForm").reset();
        await Promise.all([
          updateTransactions(),
          updateBalance(),
          updateStats(),
        ]);
        showTransactionSuccess();
      } else {
        throw new Error(data.message || "Transaction failed");
      }
    } catch (error) {
      console.error("Transaction error:", error);
      showToast(error.message || "Failed to create transaction", true);
    } finally {
      resetTransactionButton();
    }
  });

// Update the mining animation and handler
function showMiningAnimation() {
  const mineButton = document.getElementById("mineButton");
  const miningSection = document.getElementById("miningSection");

  // Disable button and show spinner
  mineButton.disabled = true;
  mineButton.innerHTML = `
    <div class="flex items-center justify-center">
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Mining...
    </div>
  `;

  // Add progress indicator below button
  const progressIndicator = document.createElement("div");
  progressIndicator.id = "miningProgress";
  progressIndicator.className =
    "mt-4 text-sm text-gray-600 animate-pulse text-center";
  progressIndicator.innerHTML = `
    <div class="flex flex-col items-center">
      <div class="mb-2">Mining new block... Please wait</div>
      <div class="w-full h-2 bg-gray-200 rounded-full">
        <div class="h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  `;

  miningSection.appendChild(progressIndicator);
}

function resetMiningButton() {
  const mineButton = document.getElementById("mineButton");
  const progressIndicator = document.getElementById("miningProgress");

  // Reset button
  mineButton.disabled = false;
  mineButton.innerHTML = "Mine New Block";

  // Remove progress indicator
  if (progressIndicator) {
    progressIndicator.remove();
  }
}

// Update the mining click handler
document.getElementById("mineButton").addEventListener("click", async () => {
  try {
    showMiningAnimation();
    const response = await fetch("/mine", { method: "POST" });
    const data = await response.json();

    if (response.ok) {
      showToast(data.message);

      // Wait for the block to appear on the blockchain
      let attempts = 0;
      const maxAttempts = 20; // Increased from 10 to 20
      const checkForBlock = async () => {
        try {
          const chainResponse = await fetch("/chain");
          if (!chainResponse.ok) {
            throw new Error("Failed to fetch chain");
          }
          const chain = await chainResponse.json();
          const latestBlock = chain[chain.length - 1];

          if (
            latestBlock &&
            latestBlock.transactions.some((tx) => tx.sender === "MINING")
          ) {
            // Block found, update everything
            await Promise.all([
              updateStats(),
              updateBlockchain(),
              updateTransactions(),
              updateBalance(),
            ]);
            resetMiningButton();
            showToast("Block successfully mined!");
          } else if (attempts < maxAttempts) {
            // Keep checking
            attempts++;
            setTimeout(checkForBlock, 1500); // Increased from 1000 to 1500ms
          } else {
            // Give up after max attempts
            showToast("Mining timed out. Please try again.", true);
            resetMiningButton();
          }
        } catch (error) {
          console.error("Error checking for new block:", error);
          showToast("Error checking mining status", true);
          resetMiningButton();
        }
      };

      checkForBlock();
    } else {
      showToast(data.message || "Mining failed", true);
      resetMiningButton();
    }
  } catch (error) {
    console.error("Mining error:", error);
    showToast("Mining failed: " + (error.message || "Unknown error"), true);
    resetMiningButton();
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

    // Add event listener for showing all attempts
    const showAllBtn = document.getElementById("showAllAttemptsBtn");
    const allAttemptsDiv = document.getElementById("allMiningAttempts");
    const btnText = document.getElementById("showAllAttemptsText");
    const btnIcon = document.getElementById("showAllAttemptsIcon");

    showAllBtn.onclick = async () => {
      const isHidden = allAttemptsDiv.classList.contains("hidden");

      if (isHidden) {
        // Show loading state
        allAttemptsDiv.classList.remove("hidden");
        allAttemptsDiv.innerHTML =
          '<div class="animate-pulse text-gray-500">Loading attempts...</div>';
        btnText.textContent = "Hide All Mining Attempts";
        btnIcon.classList.add("rotate-180");

        try {
          const response = await fetch(
            `/block/${blockIndex}/all-mining-attempts`
          );
          const allAttempts = await response.json();

          allAttemptsDiv.innerHTML = allAttempts
            .map(
              (attempt, index) => `
              <div class="flex items-center gap-2 ${
                attempt.hash.startsWith("00")
                  ? "text-green-600"
                  : "text-gray-600"
              }">
                <span class="font-mono w-8">${index}:</span>
                <span class="font-mono">Hash:</span>
                <span class="font-mono">${attempt.hash}</span>
                ${
                  attempt.hash.startsWith("00")
                    ? '<span class="text-green-600 font-semibold ml-2">(Valid!)</span>'
                    : ""
                }
              </div>
            `
            )
            .join("");
        } catch (error) {
          allAttemptsDiv.innerHTML =
            '<div class="text-red-500">Failed to load attempts</div>';
        }
      } else {
        allAttemptsDiv.classList.add("hidden");
        btnText.textContent = "Show All Mining Attempts";
        btnIcon.classList.remove("rotate-180");
      }
    };
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

// Add this with your other event listeners
document.getElementById("detailsToggle").addEventListener("click", function () {
  const panel = document.getElementById("detailsPanel");
  const isHidden = panel.classList.contains("hidden");

  panel.classList.toggle("hidden");
  this.textContent = isHidden ? "Hide Block Details" : "Show Block Details";
});

// Close panel when clicking outside
document.addEventListener("click", function (event) {
  const panel = document.getElementById("detailsPanel");
  const toggle = document.getElementById("detailsToggle");

  if (
    !panel.contains(event.target) &&
    !toggle.contains(event.target) &&
    !panel.classList.contains("hidden")
  ) {
    panel.classList.add("hidden");
    toggle.textContent = "Show Block Details";
  }
});

// Add this to your transaction creation success
function showTransactionSuccess() {
  const tx = document.createElement("div");
  tx.className =
    "fixed top-20 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg transform translate-x-full opacity-0 transition-all duration-500";
  tx.innerHTML = "💸 Transaction Created!";
  document.body.appendChild(tx);

  // Animate in
  setTimeout(() => {
    tx.classList.remove("translate-x-full", "opacity-0");
  }, 100);

  // Animate out
  setTimeout(() => {
    tx.classList.add("translate-x-full", "opacity-0");
    setTimeout(() => tx.remove(), 500);
  }, 3000);
}

// Update the stats functions
async function updateStats() {
  try {
    const [chainResponse, txResponse, balanceResponse] = await Promise.all([
      fetch("/chain"),
      fetch("/transactions"),
      fetch("/balance"),
    ]);

    // Check if any of the responses failed
    if (!chainResponse.ok || !txResponse.ok || !balanceResponse.ok) {
      throw new Error("Failed to fetch stats");
    }

    const chain = await chainResponse.json();
    const transactions = await txResponse.json();
    const balance = await balanceResponse.json();

    // Update Balance
    const balanceDisplay = document.getElementById("balanceDisplay");
    balanceDisplay.textContent = balance.balance;

    // Update Blocks Mined
    const blocksMined = document.getElementById("blocksMined");
    const minedCount = chain.filter((block) =>
      block.transactions.some(
        (tx) => tx.sender === "MINING" && tx.recipient === currentUser
      )
    ).length;
    blocksMined.textContent = minedCount;

    // Update Pending Transactions
    const pendingTxCount = document.getElementById("pendingTxCount");
    pendingTxCount.textContent = transactions.length;

    // Show/hide zero balance message
    const zeroBalanceMessage = document.getElementById("zeroBalanceMessage");
    if (balance.balance === 0) {
      zeroBalanceMessage.classList.remove("hidden");
    } else {
      zeroBalanceMessage.classList.add("hidden");
    }

    // Mark initial load as complete
    isInitialLoad = false;
  } catch (error) {
    console.error("Error updating stats:", error);
    // Only show toast for non-network errors and not during initial load
    if (error.message !== "Failed to fetch" && !isInitialLoad) {
      showToast("Failed to update stats", true);
    }
  }
}

// Add this at the start of your JavaScript to get the current user
let currentUser = "";
async function getCurrentUser() {
  try {
    const response = await fetch("/current-user");
    const data = await response.json();
    currentUser = data.username;
  } catch (error) {
    console.error("Error getting current user:", error);
  }
}

// Keep only the DOMContentLoaded event handler for initialization
document.addEventListener("DOMContentLoaded", async () => {
  isInitialLoad = true; // Reset flag on page load
  try {
    await getCurrentUser();
    await Promise.all([
      updateStats(),
      updateBlockchain(),
      updateBlockSelector(),
    ]);
  } catch (error) {
    console.error("Error during initialization:", error);
  } finally {
    isInitialLoad = false;
  }
});

// Update the refresh interval
setInterval(() => {
  if (!isInitialLoad) {
    // Only run periodic updates after initial load
    Promise.all([
      updateStats(),
      updateBlockchain(),
      updateBlockSelector(),
    ]).catch((error) => console.error("Error in periodic update:", error));
  }
}, 10000);

// Update transaction success handler
async function handleTransactionSuccess() {
  showTransactionSuccess();
  updateStats(); // Add this
  updateBlockchain();
}

// Update mining success handler
async function handleMiningSuccess() {
  showMiningAnimation();
  updateStats(); // Add this
  updateBlockchain();
}
