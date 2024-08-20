from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
from home import views
import requests
from .models import UserRegister
from os import environ as env
import json
from django.http import HttpResponse
from io import BytesIO

authorize_url = env['AUTH_URL']
grant_type="authorization_code"

def intraLogin(request):
    return redirect(authorize_url)

def create_http_response(request):
    user = UserRegister.objects.get(uid=request.user.uid)
    content = user.response_text
    response = HttpResponse(BytesIO(content.encode('utf-8')))
    response.status = user.status_code
    response.reason = "OK"
    response.headers = user.response_headers
    #response.begin()
    return response



def authRequest(request):
    if request.user.is_authenticated:
        response = UserRegister.objects.get(uid=request.user.uid)
        return views.home(request, dict(response.api_data))
    code = request.GET.get('code')

    response = exchange_code(code)

    if "error" in response.json() or request.GET.get('error') or response.status_code != 200:
        return views.login(request)
    return views.home(request, response)

def getProfilePicture(response):
    data_request = requests.get("https://api.intra.42.fr/v2/me", data=response)
    if data_request.status_code == 200:
        user_data = data_request.json()
        if isinstance(user_data, dict):
            image = user_data.get('image')
            if isinstance(image, dict):
                picture = image.get('link')
                return picture
    return ""

def getId(response):
    data_request = requests.get("https://api.intra.42.fr/v2/me", data=response)
    if data_request.status_code == 200:
        user_data = data_request.json()
        if isinstance(user_data, dict):
            id = user_data.get('id')
            return id
    return ""

def getLogin(response):
    data_request = requests.get("https://api.intra.42.fr/v2/me", data=response)
    if data_request.status_code == 200:
        user_data = data_request.json()
        if isinstance(user_data, dict):
            login = user_data.get('login')
            return login
    return ""

def exchange_code(code):
    data = {
        "grant_type": grant_type,
        "client_id": env['CLIENT_ID'],
        "client_secret": env['CLIENT_SECRET'],
        "code": code,
        "redirect_uri": "http://localhost:8080/oauth2/login/redirect",
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    
    response = requests.post("https://api.intra.42.fr/oauth/token", data=data, headers=headers)
    return response
