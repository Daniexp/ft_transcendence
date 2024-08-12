from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import random
from math import cos, sin, pi


GAME_TICK_RATE = 0.02  # Velocidad de actualización del juego en segundos
PLAYER_MOVE_INCREMENT = 5  # Incremento de movimiento del jugador
BALL_ACCELERATION = 1.01  # Aceleración de la bola
BALL_VELOCITY_INTERVAL_MAX = 1  # Rango de valores para determinar las velocidades iniciales
BALL_VELOCITY_INTERVAL_MIN = 0.5  # Rango de valores para determinar las velocidades iniciales
BALL_MIN_POSITION = 0  # Posición mínima de la pelota
BALL_MAX_POSITION_X = 300  # Posición máxima de la pelota en X
BALL_MAX_POSITION_Y = 100  # Posición máxima de la pelota en Y
PLAYER_WIDTH = 1  # Ancho del jugador
PLAYER_HEIGHT = 15  # Altura del jugador
BALL_RADIUS = 1.1  # Radio de la pelota
BOARD_WIDTH = 300  # Ancho del tablero
BOARD_HEIGHT = 100  # Altura del tablero
BOARD_X_MARGIN = 2  # Margen de los jugadores al muro por posición inicial

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
                BOARD_X_MARGIN - PLAYER_WIDTH,
                BOARD_WIDTH - ((BOARD_X_MARGIN *3 ) - PLAYER_WIDTH) 
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

        top_limit = BALL_MIN_POSITION
        bottom_limit = BALL_MAX_POSITION_Y - (BALL_RADIUS * 2) * 3

        if ball['position'][1] <= top_limit or ball['position'][1] >= bottom_limit:
            ball['velocity'][1] *= -BALL_ACCELERATION


        collision_detected = False
        for _, player in self.game_states[group_name]['players'].items():
            if self.check_collision(ball['position'], player['position']):
                if not collision_detected:
                    ball['velocity'][0] *= -BALL_ACCELERATION
                    ball['velocity'][1] *= BALL_ACCELERATION
                    collision_detected = True

                while self.check_collision(ball['position'], player['position']):
                    ball['position'][0] += ball['velocity'][0]
                    ball['position'][1] += ball['velocity'][1]
        
        left_limit = BALL_MIN_POSITION
        right_limit = BALL_MAX_POSITION_X - (BALL_RADIUS * 2) * 3

        if ball['position'][0] <= left_limit or ball['position'][0] >= right_limit:
            ball['velocity'][0] *= -BALL_ACCELERATION

    def update_player_position(self, player_id, move_value):
        if player_id in self.game_states[self.group_name]['players']:
            current_position = self.game_states[self.group_name]['players'][player_id]['position']
            new_position_y = current_position[1] + int(move_value) * PLAYER_MOVE_INCREMENT
            new_position_y = max(BALL_MIN_POSITION, min(new_position_y, BOARD_HEIGHT - PLAYER_HEIGHT))
            self.game_states[self.group_name]['players'][player_id]['position'][1] = new_position_y

    ###########################GAME_UTILS###########################

    def random_velocity(self):
        angle = random.uniform(0, 2 * pi) 
        magnitude = random.uniform(BALL_VELOCITY_INTERVAL_MIN, BALL_VELOCITY_INTERVAL_MAX)
        return [random.choice([-1, 1]) * magnitude * cos(angle), random.choice([-1, 1]) * magnitude * sin(angle)]
    
    def check_collision(self, ball_position, player_position):
        ball_x, ball_y = ball_position
        player_x, player_y = player_position

        player_left = player_x
        player_right = player_x + PLAYER_WIDTH
        player_top = player_y
        player_bottom = player_y + PLAYER_HEIGHT

        player_left_adjusted = player_left - ((BALL_RADIUS * 2) * 3)
        player_right_adjusted = player_right + BALL_RADIUS
        player_top_adjusted = player_top - BALL_RADIUS
        player_bottom_adjusted = player_bottom + BALL_RADIUS

        closest_x = max(player_left_adjusted, min(ball_x, player_right_adjusted))
        closest_y = max(player_top_adjusted, min(ball_y, player_bottom_adjusted))

        # Calcula la distancia entre el centro de la pelota y el punto más cercano en el rectángulo ajustado del jugador
        distance_x = ball_x - closest_x
        distance_y = ball_y - closest_y

        # Verifica si la distancia está dentro del radio de la pelota
        return distance_x ** 2 + distance_y ** 2 <= BALL_RADIUS ** 2








