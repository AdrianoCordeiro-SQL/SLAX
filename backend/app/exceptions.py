# Exceções de domínio convertidas em respostas HTTP pelos handlers registrados em main.


class EmailAlreadyRegistered(Exception):
    """Raised when registering with an email that already exists."""


class UserNotFoundForAccount(Exception):
    """Raised when a user id does not exist or does not belong to the account."""


class WrongCurrentPassword(Exception):
    """Raised when change-password current password does not match."""
