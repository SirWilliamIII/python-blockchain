from time import time
from printable import Printable
import hashlib
import json


class Block(Printable):
    def __init__(self, index, previous_hash, transactions, proof, timestamp=None):
        self.index = index
        self.previous_hash = previous_hash
        self.transactions = transactions
        self.proof = proof
        self.timestamp = timestamp if timestamp else time()

    def __repr__(self):
        return str(self.__dict__)

    def calculate_hash(self):
        """Calculate hash of block contents."""
        # Convert block to dictionary and sort to ensure consistent ordering
        block_string = json.dumps(self.to_dict(include_hash=False), sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def to_dict(self, include_hash=True):
        """Convert block to dictionary, optionally including its hash."""
        dict_block = {
            "index": self.index,
            "previous_hash": self.previous_hash,
            "transactions": [tx.to_dict() for tx in self.transactions],
            "proof": self.proof,
            "timestamp": self.timestamp,
        }
        if include_hash:
            dict_block["hash"] = self.calculate_hash()
        return dict_block

    def get_hash_details(self):
        """Return the details of how the hash is calculated."""
        block_dict = {
            "index": self.index,
            "previous_hash": self.previous_hash,
            "transactions": [tx.__dict__ for tx in self.transactions],
            "proof": self.proof,
            "timestamp": self.timestamp,
        }
        # Convert to sorted JSON string (for consistent ordering)
        block_string = json.dumps(block_dict, sort_keys=True)
        return {
            "input": block_string,
            "hash": hashlib.sha256(block_string.encode()).hexdigest(),
        }
