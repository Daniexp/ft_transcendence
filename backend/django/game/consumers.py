from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import random
from math import cos, sin, pi, copysign, sqrt

# Constantes del juego con relación 1:3 entre X e Y
GAME_TICK_RATE = 0.01  # Velocidad de actualización del juego en segundos
PLAYER_MOVE_INCREMENT = 5  # Incremento de movimiento del jugador
BALL_ACCELERATION = 1.05  # Aceleración de la bola
BALL_DECELERATION = 0.99  # Desaceleración mínima al rebotar
MAX_BALL_SPEED = 2.0  # Velocidad máxima de la bola
BALL_VELOCITY_RANGE = (0.5, 1)  # Rango de valores para determinar las velocidades iniciales
BALL_RADIUS  = 1.15  # Radio de la pelota en X
BOARD_WIDTH, BOARD_HEIGHT = 300, 100  # Dimensiones del tablero
PLAYER_WIDTH_X = 1  # Ancho del jugador en X
PLAYER_HEIGHT_Y = 15  # Altura del jugador en Y
BOARD_X_MARGIN = 2  # Margen de los jugadores al muro por posición inicial

class PongConsumer(AsyncWebsocketConsumer):
    users = {}
    group_id_counter = 0
    active_groups = {}
    game_states = {}

    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        await self.accept()

        existing_group = await self.get_user_group(self.user_id)
        if existing_group:
            await self.disconnect(1)
            return

        self.group_name = f'pongGame{self.__class__.group_id_counter}'
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
            self.__class__.group_id_counter += 1
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
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
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
        message = text_data_json.get('inputMsg', {})
        if isinstance(message, dict) and 'player' in message:
            player_id = list(message['player'].keys())[0]
            move_value = message['player'][player_id]
            self.update_player_position(player_id, move_value)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game_message',
                    'message': self.get_normalized_game_state()
                }
            )

    async def game_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))
    
    async def add_user(self, user_id, channel_name):
        self.users[user_id] = channel_name 

    async def remove_user(self, user_id):
        self.users.pop(user_id, None)

    async def get_user_group(self, user_id):
        for group_name, users in self.active_groups.items():
            if user_id in users:
                return group_name
        return None

    def random_velocity(self):
        angle = random.uniform(0, 2 * pi)
        magnitude = random.uniform(*BALL_VELOCITY_RANGE)
        return [random.choice([-1, 1]) * magnitude * cos(angle), random.choice([-1, 1]) * magnitude * sin(angle)]

    def init_game_state(self, group_name):
        players = self.active_groups.get(group_name, [])
        num_players = len(players)

        x_positions = []
        if num_players == 2:
            x_positions = [
                BOARD_X_MARGIN, 
                BOARD_WIDTH - (PLAYER_WIDTH_X * 3) - BOARD_X_MARGIN 
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
                'position': [x_positions[i], BOARD_HEIGHT // 2 - PLAYER_HEIGHT_Y // 2]
            }
    
    def normalize_coordinates(self, position):
        normalized_x = (position[0] / BOARD_WIDTH) * 100
        normalized_y = (position[1] / BOARD_HEIGHT) * 100
        return [normalized_x, normalized_y]

    def get_normalized_game_state(self):
        normalized_game_state = {
            'players': {},
            'ball': {
                'position': self.normalize_coordinates(self.game_states[self.group_name]['ball']['position']),
                'velocity': self.game_states[self.group_name]['ball']['velocity']
            }
        }

        for player_id, player_data in self.game_states[self.group_name]['players'].items():
            normalized_game_state['players'][player_id] = {
                'position': self.normalize_coordinates(player_data['position'])
            }

        return normalized_game_state

    async def game_loop(self, num_players):
        while len(self.active_groups[self.group_name]) == num_players:
            try:
                self.update_game_state(self.group_name)
                
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'game_message',
                        'message': self.get_normalized_game_state()
                    }
                )
            except KeyError as e:
                print(f"KeyError: {e} - The game state for the group might not be initialized properly.")
                break
            await asyncio.sleep(GAME_TICK_RATE)


    def update_game_state(self, group_name):
        ball = self.game_states[group_name]['ball']

        ball['position'][0] += ball['velocity'][0]
        ball['position'][1] += ball['velocity'][1]

        if ball['position'][1] <= 0 or ball['position'][1] >= BOARD_HEIGHT - BALL_RADIUS * 2 * 3:
            ball['position'][1] = max(0, min(ball['position'][1], BOARD_HEIGHT - BALL_RADIUS * 2 * 3))
            ball['velocity'][1] *= -BALL_DECELERATION

        for player_data in self.game_states[group_name]['players'].values():
            if self.check_collision(ball['position'], player_data['position']):
                while self.check_collision(ball['position'], player_data['position']):
                    ball['position'][0] -= ball['velocity'][0]
                    ball['position'][1] -= ball['velocity'][1]
                
                paddle_center_y = player_data['position'][1] + PLAYER_HEIGHT_Y / 2
                contact_point = (ball['position'][1] + BALL_RADIUS - paddle_center_y) / (PLAYER_HEIGHT_Y / 2)

                angle = contact_point * (pi / 4)  
                speed = sqrt(ball['velocity'][0]**2 + ball['velocity'][1]**2) * BALL_ACCELERATION
                speed = min(speed, MAX_BALL_SPEED)  

                ball['velocity'][0] = -copysign(speed * cos(angle), ball['velocity'][0])
                ball['velocity'][1] = speed * sin(angle)
                #ball['velocity'][1] += random.uniform(-0.1, 0.1)
            
            if ball['position'][0] <= 0 or ball['position'][0] >= BOARD_WIDTH - BALL_RADIUS * 2 * 3:
                ball['position'][0] = max(0, min(ball['position'][0], BOARD_WIDTH - BALL_RADIUS * 2 * 3))
                ball['velocity'][0] *= -BALL_DECELERATION


    def update_player_position(self, player_id, move_value):
        if player_id in self.game_states[self.group_name]['players']:
            current_position = self.game_states[self.group_name]['players'][player_id]['position']
            new_position_y = current_position[1] + int(move_value) * PLAYER_MOVE_INCREMENT
            new_position_y = max(0, min(new_position_y, BOARD_HEIGHT - PLAYER_HEIGHT_Y))
            self.game_states[self.group_name]['players'][player_id]['position'][1] = new_position_y

    
    def check_collision(self, ball_position, player_position):
        ball_x, ball_y = ball_position
        ball_radius = BALL_RADIUS

        player_x, player_y = player_position
        player_width = PLAYER_WIDTH_X
        player_height = PLAYER_HEIGHT_Y

        player_left = player_x
        player_right = player_x + (player_width * 3)
        player_top = player_y
        player_bottom = player_y + player_height

        ball_left = ball_x
        ball_right = ball_x + (ball_radius * 2 * 3)
        ball_top = ball_y 
        ball_bottom = ball_y + ball_radius

        return not (ball_right < player_left or
                    ball_left > player_right or
                    ball_bottom < player_top or
                    ball_top > player_bottom)

