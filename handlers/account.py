from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters.command import Command
import keyboard.account as kb
from message import messages
from aiogram.fsm.context import FSMContext
from aiogram.filters.state import StateFilter
from network.client import NetworkClient
from handlers.transaction import tx_by_account
from util.number import is_float
from state.account import AccountState

router = Router()


@router.callback_query(F.data == "create_account")
async def create_account_query(call: CallbackQuery, client: NetworkClient):
    await create_account_first_step(call.message, client)


@router.message(Command("new_account"))
async def create_account_first_step(msg: Message, client: NetworkClient, state: FSMContext):
    networks = await client.get_available_networks()
    await msg.answer(
        text=messages.account_first_step,
        reply_markup=kb.available_networks_keyboard(networks),
        parse_mode="HTML"
    )
    await state.set_state(AccountState.network_name)


@router.callback_query(AccountState.network_name)
async def transfer_to_second_step(call: CallbackQuery, client: NetworkClient, state: FSMContext):
    address_tracking_networks = await client.get_address_tracking_networks()
    chosen_network = call.data
    await state.update_data(network=chosen_network)

    if chosen_network in address_tracking_networks:
        text = messages.account_step_address
        await state.set_state(AccountState.address)
    else:
        text = messages.account_step_initial_balance
        await state.set_state(AccountState.initial_balance)

    await call.message.edit_text(text, parse_mode="HTML")


@router.message(AccountState.address)
async def handle_address(msg: Message, client: NetworkClient, state: FSMContext):
    state_data = await state.get_data()
    network = state_data['network']
    error = await client.create_account(
        network_name=network,
        address=msg.text,
        initial_balance=None
    )
    if error is not None:
        await msg.answer(f"Error: {error}")
    else:
        await msg.answer(messages.account_create_success)

    await state.clear()


@router.message(AccountState.initial_balance)
async def handle_initial_balance(msg: Message, client: NetworkClient, state: FSMContext):
    if not is_float(msg.text):
        await msg.answer(messages.numeric_reply_warning)
        return
    state_data = await state.get_data()
    network = state_data['network']
    error = await client.create_account(
        network_name=network,
        initial_balance=msg.text,
        address=None
    )
    if error is not None:
        await msg.answer(f"Error: {error}")
    else:
        await msg.answer(messages.account_create_success)

    await state.clear()


@router.message(StateFilter(None), Command("accounts"))
async def list_all_accounts(msg: Message, client: NetworkClient):
    accounts_list = await client.get_all_accounts()
    if isinstance(accounts_list, str):
        await msg.answer("Error: " + accounts_list)
        return

    list_message = ""
    for account in accounts_list:
        list_message += f"\nNetwork: <b>{account['network_name']}</b>\n"
        if account['address'] is not None:
            list_message += f"Address: <b>{account['address']}</b>\n"
        else:
            list_message += f"Balance: <b>{account['balance']}</b>\n"

    await msg.answer(
        text=messages.account_list_title + list_message,
        reply_markup=kb.control_accounts_button(),
        parse_mode="HTML"
    )


@router.callback_query(F.data == "control_accounts_menu")
async def accounts_control_menu(call: CallbackQuery, client: NetworkClient, state: FSMContext):
    accounts_list = await client.get_all_accounts()
    if isinstance(accounts_list, str):
        await call.message.answer("Error: " + accounts_list)
        return

    networks = [acc['network_name'] for acc in accounts_list]
    await call.message.edit_text(
        text=messages.select_account_to_control,
        reply_markup=kb.networks_list(networks)
    )

    await state.set_state(AccountState.control_account_scope)


@router.callback_query(AccountState.control_account_scope)
async def single_account_control_menu(call: CallbackQuery, client: NetworkClient, state: FSMContext):
    if call.data == 'back':
        await list_all_accounts(call.message, client)
        await state.clear()
        return
    network = call.data
    account = await client.get_single_account(network)

    text = ""
    text += f"Network: {network}\n"
    has_address = account['address'] is not None

    if has_address:
        text += f"Address: {account['address']}"
    else:
        text += f"Balance: {account['balance']}"

    await call.message.edit_text(
        text=text,
        reply_markup=kb.control_account_menu(has_address, network)
    )

    await state.set_state(AccountState.account_choose_action_scope)
    await state.update_data(name=network)


@router.callback_query(AccountState.account_choose_action_scope)
async def handle_account_action(call: CallbackQuery, state: FSMContext, client: NetworkClient):
    action = call.data
    if action == 'back':
        await accounts_control_menu(call, client, state)
        return
    elif action == 'change_address':
        await state.set_state(AccountState.change_address)
        await call.message.answer(
            text=messages.account_new_address,
            reply_markup=kb.cancel_kb()
        )
    elif action.startswith('tx_list'):
        await tx_by_account(call, client, state)
    else:
        await call.message.answer(
            text=messages.account_delete_confirm,
            reply_markup=kb.confirm_delete()
        )
        await state.set_state(AccountState.del_scope)


@router.message(AccountState.change_address)
async def handle_new_address(msg: Message, state: FSMContext, client: NetworkClient):
    if msg.text == 'Cancel':
        await msg.answer(messages.action_cancelled, reply_markup=kb.remove_reply())
        await state.set_state(AccountState.account_choose_action_scope)
        return

    state_data = await state.get_data()
    change_address_response = await client.change_address(
        account=state_data['name'],
        new_address=msg.text
    )

    if isinstance(change_address_response, str):
        await msg.answer(f"Error: {change_address_response}")
        return

    await msg.answer(
        text=messages.address_changed,
        reply_markup=kb.remove_reply()
    )
    await state.clear()


@router.callback_query(AccountState.del_scope)
async def delete_account(call: CallbackQuery, state: FSMContext, client: NetworkClient):
    decision = call.data
    if decision == 'no':
        await call.message.edit_text(messages.action_cancelled)
        await state.set_state(AccountState.account_choose_action_scope)
        return

    state_data = await state.get_data()
    delete_status = await client.delete_account(state_data['name'])

    if delete_status:
        await call.message.edit_text(messages.account_deleted)
    else:
        await call.message.answer(messages.error_while_deleting)

    await state.clear()
