import os
from flask import Flask, jsonify, request, render_template
from node import Node

app = Flask(__name__)
node = Node()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chain", methods=["GET"])
def get_chain():
    chain_snapshot = node.blockchain.chain
    dict_chain = [block.to_dict() for block in chain_snapshot]
    return jsonify(dict_chain), 200


@app.route("/mine", methods=["POST"])
def mine():
    result = node.blockchain.mine_block()
    if result:
        # Get the last block that was just mined
        last_block = node.blockchain.chain[-1]
        return (
            jsonify({
                "message": "Block added successfully.",
                "block": last_block.to_dict()
            }),
            201,
        )
    return jsonify({"message": "Mining failed."}), 500


@app.route("/transactions", methods=["GET", "POST"])
def handle_transactions():
    if request.method == "POST":
        values = request.get_json()
        if not values:
            return jsonify({"message": "No data found."}), 400
        required = ["recipient", "amount"]
        if not all(key in values for key in required):
            return jsonify({"message": "Required data missing."}), 400

        recipient = values["recipient"]
        amount = values["amount"]

        if node.blockchain.add_transaction(recipient, node.id, amount):
            response = {"message": "Transaction added successfully."}
            return jsonify(response), 201
        return jsonify({"message": "Transaction failed."}), 500

    elif request.method == "GET":
        transactions = [tx.to_dict() for tx in node.blockchain.get_open_transactions()]
        return jsonify(transactions), 200


@app.route("/balance", methods=["GET"])
def get_balance():
    balance = node.blockchain.get_balance()
    return jsonify({"balance": balance}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 4000))
    app.run(host="0.0.0.0", port=port)
