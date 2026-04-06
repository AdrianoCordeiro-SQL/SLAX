# Eventos e pesos de status para seed e para atividade demo ao criar cliente (SLAX Pay).

from typing import Final

PAYMENT_DEMO_ACTIONS: Final[list[str]] = [
    "payment_intent.created",
    "payment_intent.succeeded",
    "charge.succeeded",
    "customer.created",
    "invoice.paid",
    "refund.created",
    "payout.paid",
]

PAYMENT_DEMO_STATUSES: Final[list[str]] = ["Success", "Success", "Success", "Pending", "Failed"]
PAYMENT_DEMO_STATUS_WEIGHTS: Final[list[int]] = [60, 60, 60, 15, 5]
