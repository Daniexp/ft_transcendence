from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
#importar clase views donde se va a albergar la vista principal
from home import views
import requests
from os import environ as env

# Create your views here.

authorize_url = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-7f23e63d9f57af46395fc37255f56e7ad8e8c11b19428dc7518a02725743582e&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Foauth2%2Flogin%2Fredirect&response_type=code&scope=public"
state = "juajcuiwgciu7348vijbibrr"
grant_type="client_credentials"


def intraLogin(request):
    return redirect(authorize_url)

def authRequest(request):
    code = request.GET.get('code')
    response = exchange_code(code)
    #if (response == 200):
        #return provisional a patata, el buen return es a la pagina principal
    print("ahi va la response:")
    print(response.status_code)
    print("a ver si es esta request")
    print(request)
    if (request.GET.get('error')):
        return views.index(request)
    else:
        return views.loginSuccess(request)
    #elif (response == 401):
        #panel de access denied
     #   return views.index(request)

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
    print("AAAAAAAAAAAAAAAA")
    print(response)
    #print(code)
    credentials = response.json()
    print(credentials)
    return response
