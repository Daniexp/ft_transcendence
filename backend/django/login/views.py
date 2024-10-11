from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
from home import views
import requests
from os import environ as env
import json
from django.http import HttpResponse
from io import BytesIO

authorize_url = env['AUTH_URL']
grant_type="authorization_code"
get_token_url = "https://api.intra.42.fr/oauth/token"
check_token_url = "https://api.intra.42.fr/oauth/token/info"

def intraLogin(request):
    return redirect(authorize_url)

def is_token_active(response):
    data_request = requests.get("https://api.intra.42.fr/v2/me", data=response)
    if data_request.status_code == 200:
        user_data = data_request.json()
        return 1
    return 0

users = []

def authRequest(request):
    code = request.GET.get('code')
    
    if not code:
        return views.home(request, "")
    
    user_found = next((user for user in users if user.get('code') == code), None)

    if user_found and "access_token" in user_found:
        return views.home(request, user_found)

    response = exchange_code(code, get_token_url)
    user_data = response.json()

    if "error" in user_data or request.GET.get('error') or response.status_code != 200:
        return views.login(request)

    user_data['code'] = code
    users.append(user_data)

    return views.home(request, user_data)


def getProfilePicture(data_request):
    if data_request.status_code == 200:
        user_data = data_request.json()
        if isinstance(user_data, dict):
            image = user_data.get('image')
            if isinstance(image, dict):
                picture = image.get('link')
                return picture
    return ""

def getId(data_request):
    if data_request.status_code == 200:
        user_data = data_request.json()
        if isinstance(user_data, dict):
            id = user_data.get('id')
            return id
    return ""

def getLogin(data_request):
    if data_request.status_code == 200:
        user_data = data_request.json()
        if isinstance(user_data, dict):
            login = user_data.get('login')
            return login
    return ""

def exchange_code(code, url):
    data = {
        "grant_type": grant_type,
        "client_id": env['CLIENT_ID'],
        "client_secret": env['CLIENT_SECRET'],
        "code": code,
        "redirect_uri": env['HOSTNAME'],
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    
    response = requests.post(url, data=data, headers=headers)
    return response
