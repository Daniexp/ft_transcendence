from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import random
from math import cos, sin, pi


GAME_TICK_RATE = 0  # Velocidad de actualización del juego en segundos
PLAYER_MOVE_INCREMENT = 5  # Incremento de movimiento del jugador
BALL_ACCELERATION = 1.01 # Acceleracion de la bola
BALL_VELOCITY_INTERVAl_MAX = 0.007 # Rango de valores desde 0 que coge para determinar las velocidades iniciales desde 0
BALL_VELOCITY_INTERVAl_MIN = 0.002 # Rango de valores desde 0 que coge para determinar las velocidades iniciales desde 0
BALL_MIN_POSITION = 0  # Posición mínima de la pelota
BALL_MAX_POSITION_X = 100  # Posición máxima de la pelota en X
BALL_MAX_POSITION_Y = 100  # Posición máxima de la pelota en Y
PLAYER_WIDTH = 1  # Ancho del jugador
PLAYER_HEIGHT = 21.5  # Altura del jugador
BALL_RADIUS = 1.1  # Radio de la pelota
BOARD_WIDTH = 100  # Ancho del tablero
BOARD_HEIGHT = 100  # Altura del tablero
BOARD_X_MARGIN = 2 # Margen de los players al muro por posicion inicial

class PongConsumer(AsyncWebsocketConsumer):
    users = {}
    groupID = 0
    active_groups = {}
    game_states = {}

    ###########################WS_FUNCS###########################

    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        await self.accept()

        existing_group = await self.get_user_group(self.user_id)
        if existing_group:
            await self.disconnect(1)
            return

        self.group_name = f'pongGame{self.__class__.groupID}'
        await self.add_user(self.user_id, self.channel_name)

        self.active_groups.setdefault(self.group_name, []).append(self.user_id)
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        ) 
        
        await self.send(text_data=json.dumps({
            'message': f'Connected to group: {self.group_name} \nUser ID: {self.user_id}'
        }))
        
        if len(self.active_groups[self.group_name]) == 2:
            self.__class__.groupID += 1
            self.init_game_state(self.group_name)
            asyncio.ensure_future(self.game_loop(2))
            await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'game_message',
                'message': {
                    'game_started': self.game_states[self.group_name]["players"]
                }
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
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
                            'message': "Group has been emptied and removed"
                        }
                    )

            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game_message',
                    'message': "User disconnected"
                }
            )
        await self.close()

    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['inputMsg']
        if isinstance(message, dict) and 'player' in message:
            player_id = list(message['player'].keys())[0]
            move_value = message['player'][player_id]
            self.update_player_position(player_id, move_value)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game_message',
                    'message': self.game_states[self.group_name]
                }
            )

    async def game_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))
    
    ###########################GROUP_MANAGE_UTILS###########################

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

    ###########################GAME_STATUS###########################

    def init_game_state(self, group_name):
        players = self.active_groups.get(group_name, [])
        num_players = len(players)

        x_positions = []
        if num_players == 2:
            x_positions = [
                BOARD_X_MARGIN - PLAYER_WIDTH,  #Izquierda
                BOARD_WIDTH - BOARD_X_MARGIN #Derecha
            ]

        self.game_states[group_name] = {
            'players': {},
            'ball': {
                'position': [BOARD_WIDTH // 2, BOARD_HEIGHT // 2],
                'velocity': self.random_velocity()
            }
        }

        for i, user_id in enumerate(players):
            self.game_states[group_name]['players'][user_id] = {
                'position': [x_positions[i], BOARD_HEIGHT // 2 - PLAYER_HEIGHT // 2]
            }
    
    async def game_loop(self, num_players):
        while len(self.active_groups[self.group_name]) == num_players:
            try:
                self.update_game_state(self.group_name)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'game_message',
                        'message': self.game_states[self.group_name]
                    }
                )
            except KeyError as e:
                print(f"KeyError: {e} - The game state for the group might not be initialized properly.")
                break
            await asyncio.sleep(GAME_TICK_RATE)

    def update_game_state(self, group_name):
        ball = self.game_states[group_name]['ball']

        if ball['position'][1] <= BALL_MIN_POSITION or ball['position'][1] + (2 ** BALL_RADIUS) + 1 >= BALL_MAX_POSITION_Y:
            ball['velocity'][1] *= (-1 * BALL_ACCELERATION)

        for player_id, player in self.game_states[group_name]['players'].items():
            if self.check_collision(ball['position'], player['position']):
                ball['velocity'][0] *= (-1 * BALL_ACCELERATION)

        # if ball['position'][0] - BALL_RADIUS <= BALL_MIN_POSITION:
        #     ##AÑADIR GOL TODO
        # if ball['position'][0] + BALL_RADIUS >= BALL_MAX_POSITION_X:
        #     ##AÑADIR GOL TODO
        ball['position'][0] += ball['velocity'][0] 
        ball['position'][1] += ball['velocity'][1]

    def update_player_position(self, player_id, move_value):
        if player_id in self.game_states[self.group_name]['players']:
            current_position = self.game_states[self.group_name]['players'][player_id]['position']
            new_position_y = current_position[1] + int(move_value) * PLAYER_MOVE_INCREMENT
            new_position_y = max(BALL_MIN_POSITION, min(new_position_y, BOARD_HEIGHT - PLAYER_HEIGHT))
            self.game_states[self.group_name]['players'][player_id]['position'][1] = new_position_y

    ###########################GAME_UTILS###########################

    def random_velocity(self):
        angle = random.uniform(0, 2 * pi) 
        magnitude = random.uniform(BALL_VELOCITY_INTERVAl_MIN, BALL_VELOCITY_INTERVAl_MAX)
        return [random.choice([-1, 1]) * magnitude * cos(angle), random.choice([-1, 1]) * magnitude * sin(angle)]
    
    def check_collision(self, ball_position, player_position):
        ball_x, ball_y = ball_position
        player_x, player_y = player_position

        player_left = player_x
        player_right = player_x + PLAYER_WIDTH
        player_top = player_y
        player_bottom = player_y + PLAYER_HEIGHT

        ball_center_x = ball_x + BALL_RADIUS
        ball_center_y = ball_y + BALL_RADIUS

        closest_x = max(player_left, min(ball_center_x, player_right))
        closest_y = max(player_top, min(ball_center_y, player_bottom))

        distance_x = ball_center_x - closest_x
        distance_y = ball_center_y - closest_y
        distance_squared = distance_x ** 2 + distance_y ** 2

        return distance_squared <= BALL_RADIUS ** 2



