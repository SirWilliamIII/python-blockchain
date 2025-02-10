from time import time
from collections import OrderedDict
from printable import Printable


class Transaction(Printable):
    def __init__(self, sender, recipient, amount, timestamp=None):
        self.sender = sender
        self.recipient = recipient
        self.amount = amount
        self.timestamp = timestamp if timestamp else time()
        self.TRANSACTION_TIMEOUT = 3600  # 1 hour in seconds

    def __repr__(self):
        return str(self.__dict__)

    def to_ordered_dict(self):
        return OrderedDict(
            [
                ("sender", self.sender),
                ("recipient", self.recipient),
                ("amount", self.amount),
            ]
        )

    def is_expired(self):
        """Check if transaction has expired."""
        return (time() - self.timestamp) > self.TRANSACTION_TIMEOUT

    def to_dict(self):
        return {
            "sender": self.sender,
            "recipient": self.recipient,
            "amount": self.amount,
            "timestamp": self.timestamp,
        }
