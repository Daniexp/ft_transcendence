from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json

class PongConsumer(AsyncWebsocketConsumer):
    users = {}
    groupID = 0
    active_groups = {}
    RUNNING = 0

    async def connect(self):
        
        self.group_name = f'pongGame{self.__class__.groupID}'
        print(self.group_name)
        self.user_id = self.scope['user'].id if self.scope['user'].is_authenticated else self.channel_name
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        ) 
        await self.accept()
        await self.add_user(self.user_id, self.channel_name)
        self.active_groups.setdefault(self.group_name, []).append(self.user_id)

        if len(self.users) % 2 == 0 and len(self.users):
            print(f'len(self.users):{len(self.users)}')
            self.__class__.groupID += 1

        await self.send(text_data=json.dumps({
            'message': f'Connected to group: {self.group_name}'
        }))

        asyncio.ensure_future(self.game_loop())
        

    async def game_loop(self):
        self.RUNNING = 1
        while self.RUNNING:
            if len(self.active_groups.get(self.group_name, [])) >= 2:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'game_message',
                        'message': f'Game is running group: {self.group_name}'
                    }
                )
            await asyncio.sleep(0.5)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        self.RUNNING = 0
        print("DISCONNECTED FOR REAL")
        await self.remove_user(self.user_id)

    async def add_user(self, user_id, channel_name):
        self.users[user_id] = channel_name 

    async def remove_user(self, user_id):
        if user_id in self.users:
            del self.users[user_id]

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print("RECEIVED MESSAGE:", message)
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'game_message',
                'message': message
            }
        )

    async def game_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))
