from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<user_id>[-\w]+)/$', consumers.PongConsumer.as_asgi()),
    ##re_path(r'ws/pong/$', consumers.PongConsumer.as_asgi()),
]