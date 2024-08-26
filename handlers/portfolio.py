from aiogram import Router
from aiogram.types import Message
from network.client import NetworkClient
from aiogram.filters.command import Command

router = Router()


@router.message(Command("portfolio"))
async def display_portfolio(msg: Message, client: NetworkClient):
    await msg.answer("<i>Please wait a bit...</i>", parse_mode="HTML")
    await build_portfolio(msg, client)


async def build_portfolio(msg: Message, client: NetworkClient):
    portfolio_response = await client.get_portfolio()
    if portfolio_response is None:
        await msg.answer("Request limit exceed.\nPlease try again later")
        return

    currencies_text = await prepare_currencies(portfolio_response['currencies'])
    net = f"Total net worth: <b>{portfolio_response['total_usd']}$</b>\nIn BTC: <b>{portfolio_response['total_btc']}</b>"

    await msg.answer(currencies_text + net, parse_mode='HTML')


async def prepare_currencies(curs_list: list) -> str:
    text = ""
    for cur in curs_list:
        text += f"Name: {cur['name']}\n"
        text += f"Balance: {cur['balance']}\n"
        text += f"Balance (USD): {cur['balance_usd']}$\n"
        text += f"Current price (USD): {cur['cur_price']}$\n\n"
    return text