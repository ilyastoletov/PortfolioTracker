import os
import aiohttp
import json
import network.endpoint as endpoint
from typing import Optional, Union


class NetworkError(Exception):
    pass


class NetworkClient:

    def __init__(self):
        self.base_url = os.getenv("SERVER_URL")

    async def get_available_networks(self) -> list[str]:
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url + endpoint.available_networks) as response:
                if response.status == 200:
                    return json.loads(await response.text())
                else:
                    raise NetworkError()

    async def get_address_tracking_networks(self) -> list[str]:
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url + endpoint.address_tracking_networks) as response:
                if response.status == 200:
                    return json.loads(await response.text())
                else:
                    raise NetworkError()

    async def create_account(
            self,
            network_name: str,
            address: Optional[str],
            initial_balance: Optional[int]
    ) -> Optional[str]:
        async with aiohttp.ClientSession() as session:
            request_body = {
                'network_name': network_name,
                'balance': initial_balance,
                'address': address
            }
            request = session.post(
                url=self.base_url + endpoint.account_add,
                json=request_body
            )
            async with request as re:
                response: dict = json.loads(await re.text())
                return response['error'] if response.__contains__('error') else None

    async def get_all_accounts(self) -> Union[str, list]:
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url + endpoint.account_all) as response:
                resp: Union[list[dict], dict] = json.loads(await response.text())
                return resp if not resp.__contains__('error') else resp['error']

    async def get_single_account(self, network_name: str) -> Union[dict, str]:
        async with aiohttp.ClientSession() as session:
            url = self.base_url + endpoint.account_by_name + network_name
            async with session.get(url) as res:
                response_text = json.loads(await res.text())
                return response_text if not response_text.__contains__('error') else response_text['error']

    async def change_address(self, account: str, new_address: str) -> Optional[str]:
        async with aiohttp.ClientSession() as session:
            url = self.base_url + endpoint.edit_address
            request_body = {
                'account': account,
                'newAddress': new_address
            }
            async with session.patch(url=url, json=request_body) as response:
                text = json.loads(await response.text())
                return text['error'] if response.status != 200 else None

    async def delete_account(self, account: str) -> bool:
        async with aiohttp.ClientSession() as session:
            async with session.delete(url=self.base_url + endpoint.delete_account + account) as res:
                return res.status == 200

    async def new_transaction(self, amount: float, account: str, increase: bool) -> Optional[str]:
        async with aiohttp.ClientSession() as session:
            payload = {
                'account': account,
                'amount': amount,
                'increase': increase
            }
            payload_ser = json.dumps(payload)
            header = {'Content-Type': 'application/json'}
            async with session.post(url=self.base_url + endpoint.tx_add, data=payload_ser, headers=header) as response:
                text = json.loads(await response.text())
                return text['error'] if response.status != 201 else None

    async def get_transactions(self, account: str) -> Optional[list]:
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url + endpoint.tx_list + account) as response:
                text = json.loads(await response.text())
                return text if response.status == 200 else None

    async def get_portfolio(self) -> Optional[dict]:
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url + endpoint.portfolio) as response:
                text = json.loads(await response.text())
                return text if response.status == 200 else None




