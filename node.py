from uuid import uuid4
import json
import os
from blockchain import Blockchain
from verification import Verification
from db_helper import get_db_path, save_data, load_data
import time


class Node:
    def __init__(self):
        self.id = None
        self.blockchain = None
        self.current_transactions = []
        self.load_transactions()

    def initialize_blockchain(self, username):
        """Initialize the blockchain for a user"""
        self.id = username
        self.blockchain = Blockchain(self.id)
        self.load_transactions()

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

    def get_transactions(self):
        """Return all valid pending transactions"""
        # Get open transactions from blockchain
        transactions = [tx.to_dict() for tx in self.blockchain.get_open_transactions()]
        return transactions

    def add_transaction(self, sender, recipient, amount):
        """Add a new transaction"""
        if self.blockchain.add_transaction(recipient, sender, amount):
            return True
        return False

    def save_transactions(self):
        """Save transactions to file - using blockchain's save"""
        self.blockchain.save_data()

    def load_transactions(self):
        """Load transactions from blockchain if initialized"""
        if self.blockchain:
            self.blockchain.load_data()

    def mine_block(self, miner):
        """
        Create a new block and add it to the chain
        """
        # Load latest transactions before mining
        self.load_transactions()
        
        # Create the block
        block = self.create_block()
        
        # Clear mined transactions from pending list
        used_transactions = set(
            (tx['sender'], tx['recipient'], tx['amount']) 
            for tx in block['transactions']
        )
        self.current_transactions = [
            tx for tx in self.current_transactions
            if (tx['sender'], tx['recipient'], tx['amount']) not in used_transactions
        ]
        
        # Save updated pending transactions
        self.save_transactions()
        
        return block
