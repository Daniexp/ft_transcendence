from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
import time
import random
from math import cos, sin, pi, copysign, sqrt

# Constantes del juego con relación 1:3 entre X e Y
GAME_TICK_RATE = 0.001  # Velocidad de actualización del juego en segundos
PLAYER_MOVE_INCREMENT = 5  # Incremento de movimiento del jugador
BALL_ACCELERATION = 1.15  # Aceleración de la bola
BALL_DECELERATION = 0.995  # Desaceleración mínima al rebotaball_speedr
MAX_BALL_SPEED = 2.0  # Velocidad máxima de la bola
BALL_SPEED_RANGE = (0.1, 0.2)  # Rango de valores para determinar las velocidades iniciales
BALL_RADIUS = 1.15  # Radio de la pelota en X
BOARD_WIDTH, BOARD_HEIGHT = 300, 100  # Dimensiones del tablero
PLAYER_WIDTH = 1  # Ancho del jugador en X
PLAYER_HEIGHT = 15  # Altura del jugador en Y
PLAYER_AMP = pi / 6  # Grados del punto de foco
BOARD_X_MARGIN = 3  # Margen de los jugadores al muro por posición inicial
UPDATE_RATE_IA = 1
IA_LEVEL = 2

class PongConsumer(AsyncWebsocketConsumer):
    users = {}
    group_id_counter = 0
    active_groups = {}
    game_states = {}
    ia = 0

    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.game_mode = self.scope['url_route']['kwargs']['game_mode']
        await self.accept()

        existing_group = await self.get_user_group(self.user_id)
        if existing_group:
            await self.close()
            return

        max_players = self.get_max_players_for_mode(self.game_mode)
        self.group_name = await self.find_or_create_group(max_players, self.game_mode)

        if self.group_name not in self.active_groups:
            self.active_groups[self.group_name] = {"users": []}

        self.active_groups[self.group_name]["users"].append(self.user_id)

        await self.add_user(self.user_id, self.channel_name)
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.send(text_data=json.dumps({
            'message': f'Connected to group: {self.group_name} \nUser ID: {self.user_id} \nGame Mode: {self.game_mode}'
        }))

        if len(self.active_groups[self.group_name]["users"]) == max_players:
            PongConsumer.group_id_counter += 1
            if max_players == 1:
                await self.add_user("IA", self.channel_name)
                self.active_groups[self.group_name]["users"].append("IA")
                self.ia = 1
                max_players += self.ia
            self.init_game_state(self.group_name)
            asyncio.create_task(self.game_loop(max_players))
            if self.ia:
               asyncio.create_task(self.move_ia(UPDATE_RATE_IA, max_players))

            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game_message',
                    'message': {
                        'game_started': self.game_states[self.group_name]["players"]
                    }
                }
            )



    def get_max_players_for_mode(self, game_mode):
        if game_mode == '1vs1' or game_mode == 'tournament':
            return 2
        elif game_mode == '2vs2':
            return 4
        return 1 

    async def find_or_create_group(self, max_players, mode_curr):
        for group_name, group_data in self.active_groups.items():
            users = group_data["users"]
            mode = group_data["mode"]
            if len(users) < max_players and mode == mode_curr:
                return group_name

        new_group_name = f'{mode_curr}_pongGame{PongConsumer.group_id_counter}'
        self.active_groups[new_group_name] = {"users": [], "mode": mode_curr, "gameRunning": 0}
        return new_group_name


    async def disconnect(self, close_code):    
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.remove_user(self.user_id)

            if self.group_name in self.active_groups:
                if self.user_id in self.active_groups[self.group_name]["users"]:
                    self.active_groups[self.group_name]["users"].remove(self.user_id)
                
                if "IA" in self.active_groups[self.group_name]:
                    self.active_groups[self.group_name]["users"].remove("IA")
                
                if not self.active_groups[self.group_name]["users"]:
                    self.active_groups[self.group_name]['gameRunning'] = 0
                    if self.group_name in self.game_states:
                        del self.game_states[self.group_name]
                    
                    del self.active_groups[self.group_name]
                    
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            'type': 'game_message',
                            'message': "Group has been emptied and removed"
                        }
                    )
                else:
                    if self.active_groups[self.group_name]['gameRunning']:
                        print("ENTRO Y GAME:", self.active_groups[self.group_name]['gameRunning'])
                        await self.channel_layer.group_send(
                            self.group_name,
                            {
                                'type': 'game_message',
                                'message': "User disconnected"
                            }
                        )
        noMoreGoal = 1
        await self.close()


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('inputMsg', {})
        if isinstance(message, dict) and 'player' in message:
            player_id = list(message['player'].keys())[0]
            move_value = message['player'][player_id]
            
            if self.group_name in self.game_states:
                self.update_player_position(player_id, move_value)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'game_message',
                        'message': self.get_normalized_game_state()
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'error': f'Game state for group {self.group_name} not initialized.'
                }))


    async def game_message(self, event):
        message = event['message']
        try:
            await self.send(text_data=json.dumps({
                'message': message
            }))
        except Exception as e:
            print(f"Error sending message: {e}")



    async def add_user(self, user_id, channel_name):
        self.users[user_id] = channel_name 

    async def remove_user(self, user_id):
        self.users.pop(user_id, None)

    async def get_user_group(self, user_id):
        for group_name, group_data in self.active_groups.items():
            if user_id in group_data.get("users", []):
                return group_name
        return None


    def random_speed(self):
        angle_ranges = [(0, pi / 4), (3 * pi / 4, 5 * pi / 4), (7 * pi / 4, 2 * pi)]
        angle_range = random.choice(angle_ranges)
        angle = random.uniform(*angle_range)
        magnitude = random.uniform(*BALL_SPEED_RANGE)
        return [random.choice([-1, 1]) * magnitude * cos(angle), random.choice([-1, 1]) * magnitude * sin(angle)]

    def init_game_state(self, group_name):
        players = self.active_groups[group_name]["users"]
        num_players = len(players)

        x_positions = [BOARD_X_MARGIN, BOARD_WIDTH - PLAYER_WIDTH * 3 - BOARD_X_MARGIN] if num_players <= 2 else [BOARD_X_MARGIN, BOARD_X_MARGIN + (BALL_RADIUS * 2 * 3) * 1.5, BOARD_WIDTH - PLAYER_WIDTH * 3 - (BOARD_X_MARGIN + (BALL_RADIUS * 2 * 3) * 1.5), BOARD_WIDTH - PLAYER_WIDTH * 3 - BOARD_X_MARGIN] 

        print(x_positions)

        self.game_states[group_name] = {
            'players': {user_id: {'position': [x_positions[i], BOARD_HEIGHT // 2 - PLAYER_HEIGHT // 2]} for i, user_id in enumerate(players)},
            'scores': {'right_player': 0, 'left_player': 0},
            'round_wins': {'right_player': 0, 'left_player': 0},
            'ball': {
                'position': [BOARD_WIDTH // 2, BOARD_HEIGHT // 2],
                'speed': self.random_speed()
            }
        }
        self.active_groups[group_name]['gameRunning'] = 1


    def normalize_coordinates(self, position):
        return [(position[0] / BOARD_WIDTH) * 100, (position[1] / BOARD_HEIGHT) * 100]

    def get_normalized_game_state(self):
        if self.group_name not in self.game_states:
            return None

        state = self.game_states[self.group_name]
        return {
            'players': {player_id: {'position': self.normalize_coordinates(data['position'])} for player_id, data in state['players'].items()},
            'ball': {
                'position': self.normalize_coordinates(state['ball']['position']),
                'speed': state['ball']['speed']
            }
        } 

    def get_jump(self, ball_speed, ball_pos, jumps):
        speed_x, speed_y = ball_speed
        pos_x, pos_y = ball_pos
        
        jumps -= 1

        collision_y = ball_pos[1] + ball_speed[1] * (BOARD_WIDTH - ball_pos[0]) / ball_speed[0]
        if collision_y <= 0:
            cte = 0
        elif collision_y >= BOARD_HEIGHT:
            cte = BOARD_HEIGHT
        else:
            return collision_y
       
        collision_x = ball_pos[0] + ball_speed[0] * (cte - ball_pos[1]) / ball_speed[1]

        if jumps == 0:
            return collision_y
        speed_y *= -1
        pos_x = collision_x
        pos_y = cte

        return self.get_jump([speed_x, speed_y], [pos_x, pos_y], jumps)

        
    def normalize_vector(self, v):
        mod = sqrt(pow(v[0], 2) + pow(v[1], 2))
        if (mod == 0):
            return [0, 0]
        return [v[0] / mod, v[1] / mod]
    
    async def move_ia(self, updateRate, num_players):
        tick = time.monotonic()
        direction = 0
        speedNow = 0
        ball_point = self.game_states[self.group_name]['ball']['position'][1] + BALL_RADIUS
        while len(self.active_groups[self.group_name]["users"]) == num_players:  
            player_position = self.game_states[self.group_name]['players']['IA']['position'][1]
            ia_mid = player_position + PLAYER_HEIGHT / 2
            
            if abs(ball_point - ia_mid) >= 0.2 *  PLAYER_MOVE_INCREMENT:
                direction = "ArrowDown" if (ball_point - ia_mid >= 0) else "ArrowUp"
                self.update_player_position('IA', direction)
                await asyncio.sleep(0.01)


            if (time.monotonic() - tick >= UPDATE_RATE_IA):
                tick = time.monotonic()
                ball_speed = self.game_states[self.group_name]['ball']['speed']
                ball_pos = self.game_states[self.group_name]['ball']['position']
                ball_speed_u = self.normalize_vector(ball_speed)
              
                if ball_speed[0] > 0:
                    ball_point = self.get_jump(ball_speed_u, ball_pos, IA_LEVEL)
                    if ball_point >= 100:
                        ball_point = BOARD_HEIGHT * 5 / 6
                    elif ball_point <= 0:
                        ball_point = BOARD_HEIGHT / 6
                else:
                    ball_point = BOARD_HEIGHT / 2
               

            await asyncio.sleep(GAME_TICK_RATE)
                
        return

    async def game_loop(self, num_players):
        try:
            self.game_states[self.group_name]['ball']['speed'] = [0, 0]
            await self.channel_layer.group_send(self.group_name, {'type': 'game_message', 'message': self.get_normalized_game_state()})
            
            await self.wait_before_next_round(self.group_name)
            self.game_states[self.group_name]['ball']['speed'] = self.random_speed()
            
            

            while len(self.active_groups[self.group_name]["users"]) == num_players:
                self.update_game_state(self.group_name)
                await self.channel_layer.group_send(self.group_name, {'type': 'game_message', 'message': self.get_normalized_game_state()})
                await asyncio.sleep(GAME_TICK_RATE)
            self.disconnect(0)
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
                paddle_center_y = player_data['position'][1] + PLAYER_HEIGHT / 2
                contact_point = (ball['position'][1] + BALL_RADIUS - paddle_center_y) / (PLAYER_HEIGHT / 2)

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
        
        self.game_states[group_name]['scores'][scored_by] += 1
        
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
                self.game_states[group_name]['scores'] = {'right_player': 0, 'left_player': 0}

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
                    self.gameRunning = 0
                    self.disconnect(0)
                    return

        await self.wait_before_next_round(group_name)

    async def wait_before_next_round(self, group_name):
        self.game_states[group_name]['ball'] = {
            'position': [BOARD_WIDTH // 2, BOARD_HEIGHT // 2],
            'speed': [0, 0]
        }

        await self.channel_layer.group_send(group_name, {'type': 'game_message', 'message': self.get_normalized_game_state()})
        
        await asyncio.sleep(3)
        if group_name in self.game_states:
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
            finalMoveValue = 0.20
            if move_value == "ArrowUp":
                finalMoveValue *= -1
            new_position_y = max(0, min(player_position[1] + finalMoveValue * PLAYER_MOVE_INCREMENT, BOARD_HEIGHT - PLAYER_HEIGHT))
            self.game_states[self.group_name]['players'][player_id]['position'][1] = new_position_y

            if self.check_collision(ball_position, player_position):
                ball_radius_x = BALL_RADIUS * 3
                ball_radius_y = BALL_RADIUS * 3
                player_width = PLAYER_WIDTH * 3
                player_height = PLAYER_HEIGHT

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
        player_width = PLAYER_WIDTH * 3

        return (player_x <= ball_x + ball_radius_x * 2 <= player_x + player_width or
                player_x <= ball_x <= player_x + player_width)

    def check_collision_y(self, ball_position, player_position):
        ball_x, ball_y = ball_position
        ball_radius_y = BALL_RADIUS * 3
        player_x, player_y = player_position
        player_height = PLAYER_HEIGHT

        return (player_y <= ball_y + ball_radius_y * 2 <= player_y + player_height or
                player_y <= ball_y <= player_y + player_height)

    def check_collision(self, ball_position, player_position):
        return self.check_collision_x(ball_position, player_position) and self.check_collision_y(ball_position, player_position)
