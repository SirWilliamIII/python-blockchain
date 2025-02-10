from uuid import uuid4
import json
import os
from blockchain import Blockchain
from verification import Verification
from db_helper import get_db_path, save_data, load_data


class Node:
    def __init__(self):
        # Use username directly as node ID instead of UUID
        self.id = None  # Will be set when user logs in
        self.blockchain = None  # Will be initialized when user logs in

    def initialize_blockchain(self, username):
        """Initialize blockchain with username as node ID"""
        self.id = username
        self.blockchain = Blockchain(self.id)

    def load_node_id(self):
        node_id = load_data("node.txt")
        return node_id if node_id else None

    def save_node_id(self, node_id):
        save_data("node.txt", node_id)

    def verify_chain(self):
        v = Verification()
        return v.verify_chain(self.blockchain.chain)

    def verify_transactions(self):
        v = Verification()
        return v.verify_transactions(
            self.blockchain.open_transactions, self.blockchain.get_balance
        )
