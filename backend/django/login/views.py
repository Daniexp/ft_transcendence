from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
#importar clase views donde se va a albergar la vista principal
from home import views
import requests
from os import environ as env
import json

# Create your views here.

authorize_url = env['AUTH_URL']
#authorize_url="https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-7f23e63d9f57af46395fc37255f56e7ad8e8c11b19428dc7518a02725743582e&redirect_uri=http://localhost:8080/oauth2/login/redirect&response_type=code"
grant_type="authorization_code"


def intraLogin(request):
    return redirect(authorize_url)

def authRequest(request):
    code = request.GET.get('code')
    print("path:")
    print(request.build_absolute_uri)
    print("COOODE")
    print(code)

    response = exchange_code(code)
    if "error" in response.json() or request.GET.get('error'):
        return views.login(request)
    else:
        return views.loginSuccess(request)

def exchange_code(code):
    data = {
        "client_id": env['CLIENT_ID'],
        "client_secret": env['CLIENT_SECRET'],
        "grant_type": grant_type,
        "code": code,
        "redirect_uri": "http://localhost:8080/oauth2/login/redirect",
        "scope": "identify",
    }
    print("AUTH")
    print(authorize_url)
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    
    response = requests.post("https://api.intra.42.fr/oauth/token", data=data, headers=headers)
    user_data = requests.get("https://api.intra.42.fr/v2/me", data=response.json()).json()
    print(user_data.get('image'))

    print("EEEEEEEEEEEEEE")
    #print(image.json())

    print("AAAAAAAAAAAAAAAA")
    print(response.json())
    credentials = response.json()
    print(credentials)
    return response
