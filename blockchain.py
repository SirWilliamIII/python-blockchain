import hashlib
import json
from functools import reduce
from collections import OrderedDict


genesis_block = {
    'prev_hash': '',
    'index': 0,
    'transactions': [],
    'proof': 100
}

MINING_REWARD = 100
HASH_PROOF = '00'

blockchain = [genesis_block]
pending_transactions = []
OWNER = 'Will'
participants = { OWNER }

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
    last_block = blockchain[-1]
    prev_hash = hash_block(last_block)
    proof = 0
    # Try different PoW numbers and return the first valid one
    while not valid_proof(pending_transactions, prev_hash, proof):
        proof += 1
    return proof


def mine_block():
    last_block = blockchain[-1]
    hashed_block = hash_block(last_block)
    proof = proof_of_work()
    reward_transaction = OrderedDict(
        [('sender', 'MINER'), ('recipient', OWNER), ('amount', MINING_REWARD)]
    )
    transactions = pending_transactions[:]
    transactions.append(reward_transaction)
    block = {
        'prev_hash': hashed_block,
        'index': len(blockchain),
        'transactions': transactions,
        'proof': proof
    }
    blockchain.append(block)
    return True


def add_transaction(recipient, sender=OWNER, amount=1.0):
    transaction = OrderedDict(
        [('sender', sender), ('recipient', recipient), ('amount', amount)]
    )
    if verify_transaction(transaction):
        pending_transactions.append(transaction)
        participants.add(sender)
        participants.add(recipient)
        return True
    return False


def verify_transaction(transaction):
    sender_balance = get_balance(transaction['sender'])
    return sender_balance >= transaction['amount']


def print_blockchain():
    for block in blockchain:
        print('Outputting block: {}'.format(block))
    else:
        print('-' * 10)


def get_balance(participant):
    tx_sender = [[tx['amount'] for tx in block['transactions']
                  if tx['sender'] == participant] for block in blockchain]

    open_tx_sender = [tx['amount']
                      for tx in pending_transactions
                      if tx['sender'] == participant]

    tx_sender.append(open_tx_sender)
    print(tx_sender)
    amount_sent = reduce(lambda tx_sum, tx_amt: tx_sum + sum(tx_amt)
                         if len(tx_amt) > 0 else tx_sum + 0, tx_sender, 0)

    tx_recipient = [[tx['amount'] for tx in block['transactions']
                     if tx['recipient'] == participant]
                    for block in blockchain]
    amount_received = reduce(lambda tx_sum, tx_amt: tx_sum + sum(tx_amt)
                             if len(tx_amt) > 0
                             else tx_sum + 0, tx_recipient, 0)
    # Return the total balance
    return amount_received - amount_sent


def get_last_blockchain_value():
    """ Returns the last value of the current blockchain. """
    if len(blockchain) < 1:
        return None
    return blockchain[-1]


def get_transaction_value():
    tx_recipient = input('Enter the recipient of the transaction: ')
    tx_amount = float(input('Your transaction amount please: '))
    return tx_recipient, tx_amount


def verify_chain():
    for (index, block) in enumerate(blockchain):
        if index == 0:
            continue
        if block['prev_hash'] != hash_block(blockchain[index - 1]):
            return False
        if not valid_proof(block['transactions'][:-1],
                           block['prev_hash'],
                           block['proof']):
            print('Proof of work is invalid')
            return False
    return True


def verify_transactions(t):
    return all([verify_transaction(t) for t in pending_transactions])


def get_user_choice():
    """Prompts the user for its choice and return it."""
    user_input = input('Your choice: ')
    return user_input


waiting_for_input = True
while waiting_for_input:
    print('Please choose')
    print('1: Add a new transaction value')
    print('2: Mine a new block')
    print('3: Output the blockchain blocks')
    print('4: Output participants')
    print('5: Check transaction validity')
    print('h: Manipulate the chain')
    print('q: Quit')
    user_choice = get_user_choice()
    if user_choice == '1':
        tx_data = get_transaction_value()
        recipient, amount = tx_data
        # Add the transaction amount to the blockchain
        if add_transaction(recipient, amount=amount):
            print('Added transaction!')
        else:
            print('Transaction failed!')
        print(pending_transactions)
    elif user_choice == '2':
        if mine_block():
            pending_transactions = []
    elif user_choice == '3':
        print_blockchain_elements()
    elif user_choice == '4':
        print(participants)
    elif user_choice == '5':
        if verify_transactions():
            print('All transactions are valid')
        else:
            print('There are invalid transactions')
    elif user_choice == 'h':
        if len(blockchain) >= 1:
            blockchain[0] = {
                'prev_hash': '',
                'index': 0,
                'transactions': [{'sender': 'Chris', 'recipient': 'Max', 'amount': 100.0}]
            }
    elif user_choice == 'q':
        # This will lead to the loop to exist because it's running condition becomes False
        waiting_for_input = False
    else:
        print('Input was invalid, please pick a value from the list!')
    if not verify_chain():
        print_blockchain_elements()
        print('Invalid blockchain!')
        # Break out of the loop
        break
    print('Balance of {}: {:6.2f}'.format('Max', get_balance('Max')))
else:
    print('User left!')

print('Done!')

