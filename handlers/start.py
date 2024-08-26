from aiogram import Router
from aiogram.types import Message
from message import messages
from aiogram.fsm.context import FSMContext
from aiogram.filters.command import CommandStart, Command
from aiogram.filters.state import StateFilter

router = Router()


@router.message(CommandStart())
async def start_menu(msg: Message):
    await msg.answer(messages.starting_message)


@router.message(StateFilter("*"), Command("cancel"))
async def reset_state(msg: Message, state: FSMContext):
    await state.clear()
    await msg.answer(messages.state_cleared)
