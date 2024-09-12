from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<user_id>[-\w]+)/(?P<game_mode>[-\w]+)/$', consumers.PongConsumer.as_asgi()),
]