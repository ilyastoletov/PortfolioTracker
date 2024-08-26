from aiogram.utils.keyboard import (
    InlineKeyboardBuilder, InlineKeyboardMarkup, InlineKeyboardButton
)


def operation_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.add(
        InlineKeyboardButton(text="Buy 🔼", callback_data="buy"),
        InlineKeyboardButton(text="Sell 🔽", callback_data="sell")
    )
    builder.adjust(2)
    return builder.as_markup()