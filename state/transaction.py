from aiogram.fsm.state import State, StatesGroup


class TransactionState(StatesGroup):

    # Create
    network = State()
    enter_amount = State()
    operation = State()

    # List
    list_network = State()