import os
from flask import Flask, jsonify, request, render_template, session, redirect, url_for
from functools import wraps
from node import Node
import hashlib
from verification import Verification
from block import Block

app = Flask(__name__)
app.secret_key = os.environ.get(
    "SECRET_KEY", "dev_key_123"
)  # Change this in production
nodes = {}  # Store nodes for different users


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "username" not in session:
            return redirect(url_for("login"))
        if session["username"] not in nodes:
            # Re-initialize node if it was lost (e.g., server restart)
            nodes[session["username"]] = Node()
            nodes[session["username"]].initialize_blockchain(session["username"])
        return f(*args, **kwargs)

    return decorated_function


@app.route("/")
def index():
    if "username" in session:
        return render_template("index.html", username=session["username"])
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        if username == password:  # Simple validation where username must match password
            session["username"] = username
            if username not in nodes:
                nodes[username] = Node()
            # Initialize blockchain with username
            nodes[username].initialize_blockchain(username)
            return redirect(url_for("index"))
        return render_template(
            "login.html", error="Invalid credentials. Username and password must match."
        )

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()  # Clear entire session instead of just removing username
    return redirect(url_for("login"))


@app.route("/chain", methods=["GET"])
@login_required
def get_chain():
    node = nodes[session["username"]]
    chain_snapshot = node.blockchain.chain
    dict_chain = [block.to_dict() for block in chain_snapshot]
    return jsonify(dict_chain), 200


@app.route("/mine", methods=["POST"])
@login_required
def mine():
    node = nodes[session["username"]]
    result = node.blockchain.mine_block()
    if result:
        # Get the last block that was just mined
        last_block = node.blockchain.chain[-1]
        return (
            jsonify(
                {"message": "Block added successfully.", "block": last_block.to_dict()}
            ),
            201,
        )
    return jsonify({"message": "Mining failed."}), 500


@app.route("/transactions", methods=["GET"])
@login_required
def get_transactions():
    node = nodes.get(session["username"])
    if not node:
        return jsonify({"error": "Node not found"}), 404
    
    # Load latest transactions
    node.load_transactions()
    transactions = node.get_transactions()
    return jsonify(transactions)


@app.route("/transactions", methods=["POST"])
@login_required
def new_transaction():
    values = request.get_json()
    required = ['recipient', 'amount']
    if not all(k in values for k in required):
        return jsonify({"error": "Missing values"}), 400

    node = nodes.get(session["username"])
    if not node:
        return jsonify({"error": "Node not found"}), 404

    # Load latest transactions before adding new one
    node.load_transactions()
    
    # Create the new transaction
    index = node.add_transaction(
        session["username"],
        values['recipient'],
        values['amount']
    )

    response = {
        'message': f'Transaction will be added to Block {index}',
        'transaction': {
            'sender': session["username"],
            'recipient': values['recipient'],
            'amount': values['amount']
        }
    }
    return jsonify(response), 201


@app.route("/balance", methods=["GET"])
@login_required
def get_balance():
    node = nodes[session["username"]]
    balance = node.blockchain.get_balance()
    return jsonify({"balance": balance}), 200


@app.route("/block/<int:index>/hash", methods=["GET"])
@login_required
def get_block_hash_details(index):
    node = nodes[session["username"]]
    if index < len(node.blockchain.chain):
        block = node.blockchain.chain[index]
        hash_details = block.get_hash_details()
        return jsonify(hash_details), 200
    return jsonify({"message": "Block not found"}), 404


@app.route("/block/<int:index>/pow-attempts", methods=["GET"])
@login_required
def get_pow_attempts(index):
    node = nodes[session["username"]]
    if index < len(node.blockchain.chain):
        block = node.blockchain.chain[index]
        if hasattr(block, "pow_attempts"):
            return jsonify(block.pow_attempts), 200
        # If no attempts stored, return simulated data
        return (
            jsonify(
                [{"proof": block.proof, "hash": block.calculate_hash(), "valid": True}]
            ),
            200,
        )
    return jsonify({"message": "Block not found"}), 404


@app.route("/block/<int:index>/all-mining-attempts", methods=["GET"])
@login_required
def get_all_mining_attempts(index):
    node = nodes[session["username"]]
    if index < len(node.blockchain.chain):
        block = node.blockchain.chain[index]
        
        # Get transactions without mining reward
        transactions = [tx.to_ordered_dict() for tx in block.transactions if tx.sender != "MINING"]
        
        # Get the correct previous hash
        prev_hash = block.previous_hash
        
        # Simulate mining attempts
        attempts = []
        proof = 0
        found_valid = False
        
        while not found_valid:
            # Create the hash input string
            hash_string = (
                str(transactions) +
                str(prev_hash) +
                str(proof)
            ).encode()
            
            # Calculate hash
            current_hash = hashlib.sha256(hash_string).hexdigest()
            
            # Add to attempts
            attempts.append({
                "proof": proof,
                "hash": current_hash,
                "valid": current_hash.startswith("00")
            })
            
            # Check if this is a valid hash
            if current_hash.startswith("00"):
                found_valid = True
            
            proof += 1
            
            # Safety check to prevent infinite loops
            if proof > 1000:
                break
        
        return jsonify(attempts), 200
        
    return jsonify({"message": "Block not found"}), 404


@app.route("/current-user")
@login_required
def get_current_user():
    return jsonify({"username": session["username"]}), 200


if __name__ == "__main__":
    # Get port from environment variable or use 5000 as default
    port = int(os.environ.get("PORT", 5000))
    # Run the app with debug mode and allow all hosts
    app.run(host="0.0.0.0", port=port, debug=True)
