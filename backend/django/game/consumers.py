from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json

#DUPLICAR LA TAB CONNECTADA GENERA PROBLEMAS

class PongConsumer(AsyncWebsocketConsumer):
    users = {}
    groupID = 0
    active_groups = {}

    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        await self.accept()

        self.group_name = f'pongGame{self.__class__.groupID}'
        await self.add_user(self.user_id, self.channel_name)


        self.active_groups.setdefault(self.group_name, []).append(self.user_id)
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.send(text_data=json.dumps({
            'message': f'Connected to group: {self.group_name}  \n  \n User ID {self.user_id}'
        }))
        
        if len(self.active_groups[self.group_name]) == 2:
            self.__class__.groupID += 1
            asyncio.ensure_future(self.game_loop(2))

    async def game_loop(self, num_players):
        while len(self.active_groups[self.group_name]) == num_players:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game_message',
                    'message': f'Game is running group: {self.group_name} \n User ID {self.user_id}'
                }
            )
            await asyncio.sleep(0.1)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

        await self.remove_user(self.user_id)

        if self.group_name in self.active_groups:
            self.active_groups[self.group_name].remove(self.user_id)
            if not self.active_groups[self.group_name]:
                del self.active_groups[self.group_name]
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'game_message',
                'message': "disconnected"
            }
        )

    async def add_user(self, user_id, channel_name):
        self.users[user_id] = channel_name 

    async def remove_user(self, user_id):
        if user_id in self.users:
            del self.users[user_id]

    async def get_user_group(self, user_id):
        for group_name, users in self.active_groups.items():
            if user_id in users:
                return group_name
        return None

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
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
