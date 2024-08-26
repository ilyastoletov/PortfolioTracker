from aiogram.fsm.state import State, StatesGroup


class AccountState(StatesGroup):
    network_name = State()
    address = State()
    initial_balance = State()

    control_account_scope = State()
    account_choose_action_scope = State()
    change_address = State()
    del_scope = State()