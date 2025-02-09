from uuid import uuid4
import json
import os
from blockchain import Blockchain
from verification import Verification
from db_helper import get_db_path


class Node:
    def __init__(self):
        # Try to load existing node ID, or create a new one
        self.id = self.load_node_id()
        self.blockchain = Blockchain(self.id)

    def load_node_id(self):
        """Load node ID from file or create new one if none exists."""
        try:
            with open(get_db_path('node.txt'), 'r') as f:
                node_id = f.read().strip()
                if node_id:
                    return node_id
        except (IOError, IndexError):
            pass
        
        # If no valid ID found, create new one and save it
        node_id = str(uuid4())
        self.save_node_id(node_id)
        return node_id

    def save_node_id(self, node_id):
        """Save node ID to file."""
        try:
            with open(get_db_path('node.txt'), 'w') as f:
                f.write(node_id)
        except IOError:
            print("Could not save node ID!")

    def verify_chain(self):
        v = Verification()
        return v.verify_chain(self.blockchain.chain)

    def verify_transactions(self):
        v = Verification()
        return v.verify_transactions(
            self.blockchain.open_transactions, 
            self.blockchain.get_balance
        )
