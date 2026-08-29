from enum import IntEnum


class RecoveryAction(IntEnum):
    WAIT = 0
    RETRY_CHECKOUT = 1
    SUGGEST_ALT_METHOD = 2
    CREATE_PAYMENT_LINK = 3
    RESEND_LINK = 4
    NOTIFY_CUSTOMER = 5
    REQUEST_METHOD_UPDATE = 6
    OFFER_PARTIAL = 7
    ESCALATE_HUMAN = 8
    RECONCILE = 9
    STOP = 10


ACTION_NAMES = [a.name.lower() for a in RecoveryAction]
NUM_ACTIONS = len(RecoveryAction)

# Cost in INR (communication / ops)
ACTION_COST_INR = {
    RecoveryAction.WAIT: 0.0,
    RecoveryAction.RETRY_CHECKOUT: 0.05,
    RecoveryAction.SUGGEST_ALT_METHOD: 0.10,
    RecoveryAction.CREATE_PAYMENT_LINK: 0.15,
    RecoveryAction.RESEND_LINK: 0.10,
    RecoveryAction.NOTIFY_CUSTOMER: 0.25,
    RecoveryAction.REQUEST_METHOD_UPDATE: 0.20,
    RecoveryAction.OFFER_PARTIAL: 0.15,
    RecoveryAction.ESCALATE_HUMAN: 5.0,
    RecoveryAction.RECONCILE: 0.05,
    RecoveryAction.STOP: 0.0,
}
