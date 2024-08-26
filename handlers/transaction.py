from aiogram import Router
from aiogram.types import Message, CallbackQuery
from network.client import NetworkClient
from aiogram.fsm.context import FSMContext
from aiogram.filters.command import Command
from state.transaction import TransactionState
from aiogram.filters.state import StateFilter
from message import messages
from keyboard.account import networks_list, cancel_kb, remove_reply
from keyboard.transaction import operation_kb
from util.number import is_float

router = Router()


@router.message(StateFilter(None), Command('new_tx'))
async def new_tx_choose_account(msg: Message, client: NetworkClient, state: FSMContext):
    accounts_list = await client.get_all_accounts()

    if isinstance(accounts_list, str):
        await msg.answer(f"Error: {accounts_list}")
        return

    await msg.answer(
        text=messages.new_transaction,
        reply_markup=networks_list(filter_accounts_list(accounts_list))
    )

    await state.set_state(TransactionState.network)


def filter_accounts_list(acs: list[dict]) -> list[str]:
    filtered = []
    for ac in acs:
        if ac['address'] is not None:
            continue
        filtered.append(ac['network_name'])
    return filtered


@router.callback_query(TransactionState.network)
async def new_tx_enter_amount(call: CallbackQuery, state: FSMContext):
    if call.data == 'back':
        await call.message.answer(messages.action_cancelled)
        return

    await state.update_data(network=call.data)

    await call.message.answer(
        text=messages.tx_enter_amount + call.data,
        reply_markup=cancel_kb(),
        parse_mode="HTML"
    )
    await state.set_state(TransactionState.enter_amount)


@router.message(TransactionState.enter_amount)
async def new_tx_operation(msg: Message, state: FSMContext):
    if not is_float(msg.text):
        await msg.answer(messages.numeric_reply_warning)
        return

    if float(msg.text) <= 0:
        await msg.answer(messages.zero_amount_error)
        return

    await state.update_data(amount=msg.text)

    await msg.answer(
        text="Choose operation",
        reply_markup=operation_kb()
    )
    await state.set_state(TransactionState.operation)


@router.callback_query(TransactionState.operation)
async def new_tx_assemble(call: CallbackQuery, state: FSMContext, client: NetworkClient):
    state_data = await state.get_data()
    increase = True if call.data == "buy" else False
    account = state_data['network']
    amount = float(state_data['amount'])

    error = await client.new_transaction(
        amount=amount,
        increase=increase,
        account=account
    )
    if error is not None:
        await call.message.answer(
            text=f"Error: {error}",
            reply_markup=remove_reply()
        )
        await state.clear()
        return

    action = "Buy" if increase else "Sell"
    await call.message.answer(
        text=f"Transaction successfully created.\n\n"
             f"Account: <b>{account}</b>\n"
             f"Amount: <b>{amount}</b>\n"
             f"Action: <b>{action}</b>",
        parse_mode="HTML",
        reply_markup=remove_reply()
    )
    await state.clear()


@router.message(StateFilter(None), Command('tx_list'))
async def list_tx_choose_account(msg: Message, client: NetworkClient, state: FSMContext):
    accounts_list = await client.get_all_accounts()
    if isinstance(accounts_list, str):
        await msg.answer(f"Error: {accounts_list}")
        return
    fmt_accounts = filter_accounts_list(accounts_list)
    await msg.answer(
        text=messages.tx_list_choose_account,
        reply_markup=networks_list(fmt_accounts)
    )
    await state.set_state(TransactionState.list_network)


@router.callback_query(TransactionState.list_network)
async def tx_by_account(call: CallbackQuery, client: NetworkClient, state: FSMContext):
    if call.data == 'back':
        await call.message.edit_text(messages.action_cancelled)
        await state.clear()
        return

    network = call.data if not call.data.startswith('tx_list') else call.data.split("_")[2]
    tx_list = await client.get_transactions(network)

    if tx_list is None:
        await call.message.answer(messages.tx_list_fetch_error)
        await state.clear()
        return

    formatted_tx_list_text = format_transactions(tx_list)
    total = calculate_total(tx_list)

    await call.message.answer(
        text=formatted_tx_list_text + total,
        parse_mode="HTML"
    )

    cur_state = await state.get_state()
    if cur_state is not None and cur_state.__contains__("list_network"):
        await state.clear()


def format_transactions(tx_list: list) -> str:
    tx_fmt_text = ""
    for tx in tx_list:
        action = "Buy" if bool(tx['increase_balance']) else "Sell"
        action_sign = "+" if bool(tx['increase_balance']) else "-"
        amount = round(tx['amount'], 10)
        buy_usd = tx['buy_price_usd']
        usd = round(amount * buy_usd, 2)
        tx_fmt_text += \
            (f"\nAmount: <b>{amount}</b>\n"
             f"Action: <b>{action}</b>\n"
             f"Buy price (USD): <b>{buy_usd}$</b>\n"
             f"Value (USD): <b>{action_sign}{usd}</b>$\n"
             )
    return tx_fmt_text


def calculate_total(tx_list: list) -> str:
    total_str_template = "\nTotal: <b>{}</b>\nTotal (USD): <b>{}$</b>"
    total = 0
    total_usd = 0
    for tx in tx_list:
        amount = float(tx['amount'])
        buy_price_usd = float(tx['buy_price_usd'])
        increase = True if bool(tx['increase_balance']) else False
        if increase:
            total += amount
            total_usd += amount * buy_price_usd
        else:
            total -= amount
            total_usd -= amount * buy_price_usd
    return total_str_template.format(str(round(total, 10)), str(round(total_usd, 2)))