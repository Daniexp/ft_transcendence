from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
#importar clase views donde se va a albergar la vista principal
from home import views
import requests
from os import environ as env

# Create your views here.

authorize_url = env['AUTH_URL']
state = "juajcuiwgciu7348vijbibrr"
grant_type="client_credentials"


def intraLogin(request):
    return redirect(authorize_url)

def authRequest(request):
    code = request.GET.get('code')
    response = exchange_code(code)
    if "error" in response.json() or request.GET.get('error'):
        return views.login(request)
    else:
        return views.loginSuccess(request)

def exchange_code(code):
    data = {
        "grant_type":grant_type,
        "client_id": env['CLIENT_ID'],
        "client_secret": env['CLIENT_SECRET'],
        "code": code,
        "redirect_uri": env['REDIRECT_URI'],
        #"state": state,
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    
    response = requests.post("https://api.intra.42.fr/oauth/token", data=data, headers=headers)
    print("Response_Headers: ")
    print(response.headers)
    image = requests.get("https://api.intra.42.fr/v2/users/id", data=response.json())
    print("Image_Headers: ")
    print(image.headers)

    print("EEEEEEEEEEEEEE")
    print(image.json())
    print("AAAAAAAAAAAAAAAA")
    print(response.json())
    credentials = response.json()
    print(credentials)
    return response
