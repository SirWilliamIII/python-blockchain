import json
from functools import reduce

from hash_helpers import hash_block
from block import Block
from transaction import Transaction
from verification import Verification
from db_helper import get_db_path, save_data, load_data


MINING_REWARD = 10


class Blockchain:
    def __init__(self, hosting_node_id):
        genesis_block = Block(0, "", [], 100, 0)
        self.chain = [genesis_block]
        self.open_transactions = []
        self.load_data()
        self.hosting_node_id = hosting_node_id

    def load_data(self):
        try:
            blockchain_data = load_data("blockchain.txt")
            if blockchain_data:
                blockchain = blockchain_data[0] if isinstance(blockchain_data, list) else blockchain_data
                updated_blockchain = []
                for block in blockchain:
                    converted_transaction = [
                        Transaction(tx["sender"], tx["recipient"], tx["amount"])
                        for tx in block["transactions"]
                    ]
                    updated_block = Block(
                        block["index"],
                        block["previous_hash"],
                        converted_transaction,
                        block["proof"],
                        block["timestamp"],
                    )
                    updated_blockchain.append(updated_block)
                self.chain = updated_blockchain
                
                open_transactions = blockchain_data[1] if isinstance(blockchain_data, list) else []
                updated_transactions = []
                for tx in open_transactions:
                    updated_transaction = Transaction(
                        tx["sender"], tx["recipient"], tx["amount"]
                    )
                    updated_transactions.append(updated_transaction)
                self.open_transactions = updated_transactions
        except Exception as e:
            print(f"Loading data failed: {e}")

    def save_data(self):
        try:
            clone_blockchain = [
                block.__dict__
                for block in [
                    Block(
                        block_el.index,
                        block_el.previous_hash,
                        [tx.__dict__ for tx in block_el.transactions],
                        block_el.proof,
                        block_el.timestamp,
                    )
                    for block_el in self.chain
                ]
            ]
            saveable_transactions = [tx.__dict__ for tx in self.open_transactions]
            save_data("blockchain.txt", [clone_blockchain, saveable_transactions])
        except Exception as e:
            print(f"Saving failed: {e}")

    def proof_of_work(self):
        last_block = self.chain[-1]
        last_hash = hash_block(last_block)
        proof = 0
        attempts = []  # Track attempts
        v = Verification()

        # Track up to 5 failed attempts plus the successful one
        while not v.valid_proof(self.open_transactions, last_hash, proof):
            if len(attempts) < 5:  # Store only first 5 failed attempts
                attempts.append(
                    {
                        "proof": proof,
                        "hash": v.get_proof_hash(
                            self.open_transactions, last_hash, proof
                        ),
                    }
                )
            proof += 1

        # Add successful attempt
        attempts.append(
            {
                "proof": proof,
                "hash": v.get_proof_hash(self.open_transactions, last_hash, proof),
                "valid": True,
            }
        )

        # Store attempts with the block for later retrieval
        self.last_pow_attempts = attempts
        return proof

    def get_balance(self):
        """Calculate and return the balance for the current hosting node."""
        participant = self.hosting_node_id

        # Get amounts sent by this participant
        tx_sender = [
            [tx.amount for tx in block.transactions if tx.sender == participant]
            for block in self.chain
        ]

        # Get amounts received by this participant (including mining rewards)
        tx_recipient = [
            [tx.amount for tx in block.transactions if tx.recipient == participant]
            for block in self.chain
        ]

        # Include pending transactions for sent amounts
        open_tx_sender = [
            tx.amount for tx in self.open_transactions if tx.sender == participant
        ]
        tx_sender.append(open_tx_sender)

        # Calculate total sent
        amount_sent = reduce(
            lambda tx_sum, tx_amt: (
                tx_sum + sum(tx_amt) if len(tx_amt) > 0 else tx_sum + 0
            ),
            tx_sender,
            0,
        )

        # Calculate total received
        amount_received = reduce(
            lambda tx_sum, tx_amt: (
                tx_sum + sum(tx_amt) if len(tx_amt) > 0 else tx_sum + 0
            ),
            tx_recipient,
            0,
        )

        # Return the difference
        return amount_received - amount_sent

    def get_last_blockchain_value(self):
        if len(self.chain) < 1:
            return None
        return self.chain[-1]

    def add_transaction(self, recipient, sender, amount=1.0):
        transaction = Transaction(sender, recipient, amount)
        v = Verification()
        if v.verify_transaction(transaction, self.get_balance):
            self.open_transactions.append(transaction)
            self.save_data()
            return True
        return False

    def mine_block(self):
        last_block = self.chain[-1]
        hashed_block = hash_block(last_block)
        proof = self.proof_of_work()
        reward_transaction = Transaction("MINING", self.hosting_node_id, MINING_REWARD)
        copied_transactions = self.open_transactions[:]
        copied_transactions.append(reward_transaction)
        block = Block(len(self.chain), hashed_block, copied_transactions, proof)
        self.chain.append(block)
        self.open_transactions = []
        self.save_data()
        return True

    def cleanup_transactions(self):
        """Remove expired transactions from open_transactions."""
        current_transactions = self.open_transactions[:]
        self.open_transactions = [
            tx for tx in current_transactions if not tx.is_expired()
        ]

    def get_open_transactions(self):
        """Get open transactions after removing expired ones."""
        self.cleanup_transactions()
        return self.open_transactions[:]
