from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
from home import views
import requests
from os import environ as env
import json

authorize_url = env['AUTH_URL']
grant_type="authorization_code"


def login(request):
    return render

def intraLogin(request):
    print("TUKOOOO")
    return redirect(authorize_url)

def authRequest(request):
    code = request.GET.get('code')

    response = exchange_code(code)

    if "error" in response.json() or request.GET.get('error'):
        print("ERROR ON LOGIN")
        return views.login(request)
    return views.home(request, response)

def getProfilePicture(response):
    data_request = requests.get("https://api.intra.42.fr/v2/me", data=response.json())
    if data_request.status_code == 200:
        user_data = data_request.json()
        if isinstance(user_data, dict):
            image = user_data.get('image')
            if isinstance(image, dict):
                picture = image.get('link')
                return picture
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
