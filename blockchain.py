import hashlib
import json
from functools import reduce
from collections import OrderedDict

genesis_block = {
    'previous_hash': '',
    'index': 0,
    'transactions': [],
    'proof': 100
}

HASH_PROOF = '00'
PENDING_TRANSACTIONS = []
BLOCKCHAIN = [genesis_block]

def create_hash(s):
    return hashlib.sha256(s).hexdigest()


def hash_block(b):
    return create_hash(json.dumps(b, sort_keys=True).encode())


def valid_proof(transactions, prev_hash, proof):
    guess = (str(transactions) + str(prev_hash) + str(proof)).encode()
    guess_hash = create_hash(guess)
    print(guess_hash)
    return guess_hash[0:2] == HASH_PROOF


def proof_of_work():
    last_block = BLOCKCHAIN[-1]
    prev_hash = hash_block(last_block)
    # Try different PoW numbers and return the first valid one
    while not valid_proof(PENDING_TRANSACTIONS, prev_hash, proof):
        proof += 1
    return proof

