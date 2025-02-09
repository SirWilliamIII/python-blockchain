from uuid import uuid4

from blockchain import Blockchain
from verification import Verification


class Node:
    def __init__(self):
        # Generate a random ID instead of hardcoding
        self.id = str(uuid4())
        self.blockchain = Blockchain(self.id)

    def verify_chain(self):
        v = Verification()
        return v.verify_chain(self.blockchain.chain)

    def verify_transactions(self):
        v = Verification()
        return v.verify_transactions(
            self.blockchain.open_transactions, 
            self.blockchain.get_balance
        )
