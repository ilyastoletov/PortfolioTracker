from aiogram import Router
from aiogram.filters.exception import ExceptionTypeFilter
from network.client import NetworkError
from aiogram.types.error_event import ErrorEvent
from aiogram.types import Update

router = Router()

@router.errors(ExceptionTypeFilter(NetworkError))
async def network_error_handler(event: ErrorEvent, upd: Update):
    await upd.message.answer(f"There was an error while making network request.\nDetails: {event.exception}")