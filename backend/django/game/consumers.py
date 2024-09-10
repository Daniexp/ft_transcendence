from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import random
from math import cos, sin, pi, copysign, sqrt

# Constantes del juego con relación 1:3 entre X e Y
GAME_TICK_RATE = 0.0005  # Velocidad de actualización del juego en segundos
PLAYER_MOVE_INCREMENT = 5  # Incremento de movimiento del jugador
BALL_ACCELERATION = 1.15  # Aceleración de la bola
BALL_DECELERATION = 0.995  # Desaceleración mínima al rebotaball_speedr
MAX_BALL_SPEED = 2.0  # Velocidad máxima de la bola
BALL_SPEED_RANGE = (0.15, 0.2)  # Rango de valores para determinar las velocidades iniciales
BALL_RADIUS = 1.15  # Radio de la pelota en X
BOARD_WIDTH, BOARD_HEIGHT = 300, 100  # Dimensiones del tablero
PLAYER_WIDTH_X = 1  # Ancho del jugador en X
PLAYER_HEIGHT_Y = 15  # Altura del jugador en Y
PLAYER_AMP = pi / 6  # Grados del punto de foco
BOARD_X_MARGIN = 3  # Margen de los jugadores al muro por posición inicial

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

        self.group_name = f'pongGame{PongConsumer.group_id_counter}'
        await self.add_user(self.user_id, self.channel_name)

        self.active_groups.setdefault(self.group_name, []).append(self.user_id)
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        await self.send(text_data=json.dumps({
            'message': f'Connected to group: {self.group_name} \nUser ID: {self.user_id}'
        }))
        
        if len(self.active_groups[self.group_name]) == 2:
            PongConsumer.group_id_counter += 1
            self.init_game_state(self.group_name)
            asyncio.create_task(self.game_loop(2))
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
        await self.send(text_data=json.dumps({'message': message}))

    async def add_user(self, user_id, channel_name):
        self.users[user_id] = channel_name 

    async def remove_user(self, user_id):
        self.users.pop(user_id, None)

    async def get_user_group(self, user_id):
        return next((group_name for group_name, users in self.active_groups.items() if user_id in users), None)

    def random_speed(self):
        angle_ranges = [(0, pi / 4), (3 * pi / 4, 5 * pi / 4), (7 * pi / 4, 2 * pi)]
        angle_range = random.choice(angle_ranges)
        angle = random.uniform(*angle_range)
        magnitude = random.uniform(*BALL_SPEED_RANGE)
        return [random.choice([-1, 1]) * magnitude * cos(angle), random.choice([-1, 1]) * magnitude * sin(angle)]

    def init_game_state(self, group_name):
        players = self.active_groups.get(group_name, [])
        num_players = len(players)

        x_positions = [BOARD_X_MARGIN, BOARD_WIDTH - PLAYER_WIDTH_X * 3 - BOARD_X_MARGIN] if num_players == 2 else []

        self.game_states[group_name] = {
            'players': {user_id: {'position': [x_positions[i], BOARD_HEIGHT // 2 - PLAYER_HEIGHT_Y // 2]} for i, user_id in enumerate(players)},
            'scores': {player: 0 for player in players},
            'round_wins': {player: 0 for player in players},
            'ball': {
                'position': [BOARD_WIDTH // 2, BOARD_HEIGHT // 2],
                'speed': self.random_speed()
            }
        }

    def normalize_coordinates(self, position):
        return [(position[0] / BOARD_WIDTH) * 100, (position[1] / BOARD_HEIGHT) * 100]

    def get_normalized_game_state(self):
        state = self.game_states[self.group_name]
        return {
            'players': {player_id: {'position': self.normalize_coordinates(data['position'])} for player_id, data in state['players'].items()},
            'ball': {
                'position': self.normalize_coordinates(state['ball']['position']),
                'speed': state['ball']['speed']
            }
        }

    async def game_loop(self, num_players):
        try:
            self.game_states[self.group_name]['ball']['speed'] = [0, 0]
            await self.channel_layer.group_send(self.group_name, {'type': 'game_message', 'message': self.get_normalized_game_state()})
            
            await self.wait_before_next_round(self.group_name)
            self.game_states[self.group_name]['ball']['speed'] = self.random_speed()

            while len(self.active_groups[self.group_name]) == num_players:
                self.update_game_state(self.group_name)
                
                await self.channel_layer.group_send(self.group_name, {'type': 'game_message', 'message': self.get_normalized_game_state()})
                await asyncio.sleep(GAME_TICK_RATE)
        except Exception:
            await self.disconnect(0)

    countRetry = 0
    noMoreGoal = 1
    def update_game_state(self, group_name):
        ball = self.game_states[group_name]['ball']
        ball['position'][0] += ball['speed'][0]
        ball['position'][1] += ball['speed'][1]

        if ball['position'][1] <= 0 or ball['position'][1] >= BOARD_HEIGHT - BALL_RADIUS * 2 * 3:
            ball['position'][1] = max(0, min(ball['position'][1], BOARD_HEIGHT - BALL_RADIUS * 2 * 3))
            ball['speed'][1] *= -BALL_DECELERATION
        
        self.countRetry += 1

        for player_id, player_data in self.game_states[group_name]['players'].items():
            if self.check_collision(ball['position'], player_data['position']) and self.countRetry >= 100:
                paddle_center_y = player_data['position'][1] + PLAYER_HEIGHT_Y / 2
                contact_point = (ball['position'][1] + BALL_RADIUS - paddle_center_y) / (PLAYER_HEIGHT_Y / 2)

                self.countRetry = 0
            
                angle = contact_point * PLAYER_AMP
                speed = min(sqrt(ball['speed'][0]**2 + ball['speed'][1]**2) * BALL_ACCELERATION, MAX_BALL_SPEED)

                ball['speed'][0] = -copysign(speed * cos(angle), ball['speed'][0])
                ball['speed'][1] = speed * sin(angle)

        if not self.noMoreGoal:
            if ball['position'][0] <= -BALL_RADIUS * 2 * 3:
                asyncio.create_task(self.handle_goal(group_name, 'right_player'))
            elif ball['position'][0] >= BOARD_WIDTH:
                asyncio.create_task(self.handle_goal(group_name, 'left_player'))

    async def handle_goal(self, group_name, scored_by):
        self.noMoreGoal = 1
        players = list(self.game_states[group_name]['players'].keys())
        if scored_by == 'right_player':
            self.game_states[group_name]['scores'][players[0]] += 1
        else:
            self.game_states[group_name]['scores'][players[1]] += 1

        await self.channel_layer.group_send(group_name, {
            'type': 'game_message',
            'message': {
                'goal_scored': True,
                'scored_by': scored_by,
                'scores': self.game_states[group_name]['scores']
            }
        })

        for player, score in self.game_states[group_name]['scores'].items():
            if score >= 2:
                self.game_states[group_name]['round_wins'][player] += 1
                self.game_states[group_name]['scores'] = {p: 0 for p in players}

                if self.game_states[group_name]['round_wins'][player] >= 3:
                    self.game_states[group_name]['game_over'] = True

                    await self.channel_layer.group_send(group_name, {
                        'type': 'game_message',
                        'message': {
                            'game_over': True,
                            'winner': player,
                            'round_wins': self.game_states[group_name]['round_wins']
                        }
                    })
                    return

        await self.wait_before_next_round(group_name)

    async def wait_before_next_round(self, group_name):
        self.game_states[group_name]['ball'] = {
            'position': [BOARD_WIDTH // 2, BOARD_HEIGHT // 2],
            'speed': [0, 0]
        }

        await self.channel_layer.group_send(group_name, {'type': 'game_message', 'message': self.get_normalized_game_state()})
        
        await asyncio.sleep(3)

        self.game_states[group_name]['ball'] = {
            'position': [BOARD_WIDTH // 2, BOARD_HEIGHT // 2],
            'speed': self.random_speed()
        }

        await self.channel_layer.group_send(group_name, {'type': 'game_message', 'message': self.get_normalized_game_state()})

        self.noMoreGoal = 0

    def update_player_position(self, player_id, move_value):
        ball_position = self.game_states[self.group_name]['ball']['position']
        ball_speed = self.game_states[self.group_name]['ball']['speed']
        player_position = self.game_states[self.group_name]['players'][player_id]['position']
        if player_id in self.game_states[self.group_name]['players'] and not self.check_collision(ball_position, player_position):
            new_position_y = max(0, min(player_position[1] + float(move_value) * PLAYER_MOVE_INCREMENT, BOARD_HEIGHT - PLAYER_HEIGHT_Y))
            self.game_states[self.group_name]['players'][player_id]['position'][1] = new_position_y

            if self.check_collision(ball_position, player_position):
                ball_radius_x = BALL_RADIUS * 3
                ball_radius_y = BALL_RADIUS * 3
                player_width = PLAYER_WIDTH_X * 3
                player_height = PLAYER_HEIGHT_Y

                if ball_position[0] + ball_radius_x * 2 >= player_position[0] and ball_speed[0] > 0:
                    overlap_x = (ball_position[0] + ball_radius_x * 2) - player_position[0]
                    ball_position[0] -= min(overlap_x, abs(ball_speed[0]))
                elif ball_position[0] <= player_position[0] + player_width and ball_speed[0] < 0:
                    overlap_x = player_position[0] + player_width - ball_position[0]
                    ball_position[0] += min(overlap_x, abs(ball_speed[0]))

                if ball_position[1] + ball_radius_y * 2 >= player_position[1] and ball_speed[1] < 0:
                    overlap_y = (ball_position[1] + ball_radius_y * 2) - player_position[1]
                    ball_position[1] -= min(overlap_y, abs(ball_speed[1]))
                elif ball_position[1] <= player_position[1] + player_height and ball_speed[1] > 0:
                    overlap_y = player_position[1] + player_height - ball_position[1]
                    ball_position[1] += min(overlap_y, abs(ball_speed[1]))

    def check_collision_x(self, ball_position, player_position):
        ball_x, ball_y = ball_position
        ball_radius_x = BALL_RADIUS * 3
        player_x, player_y = player_position
        player_width = PLAYER_WIDTH_X * 3

        return (player_x <= ball_x + ball_radius_x * 2 <= player_x + player_width or
                player_x <= ball_x <= player_x + player_width)

    def check_collision_y(self, ball_position, player_position):
        ball_x, ball_y = ball_position
        ball_radius_y = BALL_RADIUS * 3
        player_x, player_y = player_position
        player_height = PLAYER_HEIGHT_Y

        return (player_y <= ball_y + ball_radius_y * 2 <= player_y + player_height or
                player_y <= ball_y <= player_y + player_height)

    def check_collision(self, ball_position, player_position):
        return self.check_collision_x(ball_position, player_position) and self.check_collision_y(ball_position, player_position)
