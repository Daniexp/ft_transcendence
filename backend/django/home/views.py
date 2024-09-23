from django.shortcuts import render, redirect
from os import environ as env
import requests
from login.models import UserRegister
from django.contrib.auth.decorators import login_required
import os
from login import views as loginViews
from login.models import UserRegister as pongdb
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.models import User as UserData


# Create your views here.

def login(request):
    return render(request, "index.html")

#DECLAEANDO LA VISTA PARA LA REQUEST ENTRANTE
def somethingHappened(request):
    return render(request, 'aux.html')

def revoke_token(request):
    user = UserRegister.objects.get(uid=request.user.uid)
    revoke_url = 'https://api.intra.42.fr/v2/revoke'

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    print("token_to_revoke")
    token_to_revoke = user.api_data["access_token"]
    print(token_to_revoke)

    payload = {
        'token': token_to_revoke,
        'token_type_hint': 'access_token',  # o 'refresh_token', según el caso
        'client_id': env['CLIENT_ID'],
    }

    response = requests.post(revoke_url, data=payload, headers=headers)

    print(response.reason)
    if response.status_code == 200:
        print('Token revocado exitosamente')

def logout(request):
    print(request.user.login)
    print(request.user.is_active)
    if (request.user.is_authenticated):
        user_api_data = UserRegister.objects.get(login=request.user.login).api_data 
        print(user_api_data)
        #Queda revokear el token - abortamos, no hay manera

        #la linea siguiente se puede deletear, lo tengo pendiente
        data_request = requests.get("https://api.intra.42.fr/oauth/token/info", data=user_api_data)
        auth_logout(request)
    print(request.user.is_authenticated)
    return redirect('/')

def register_user(request, login_name, id, response):
    if not UserRegister.objects.filter(uid=id, login=login_name).exists():
        user_data = UserRegister.objects.create(uid=id, login=login_name, api_data=response)
        user_data.backend = 'django.contrib.auth.backends.ModelBackend'
    else:
        user_data = UserRegister.objects.get(uid=id, login=login_name)
        user_data.api_data = response
    user_data.save()
    auth_login(request, user_data)


def get_user_data(request, response):
    data_request = requests.get("https://api.intra.42.fr/v2/me", data=response)
    picture = loginViews.getProfilePicture(data_request)
    id = loginViews.getId(data_request)
    login_name = loginViews.getLogin(data_request)
    return picture, login_name, id


def home(request, response = ""):
#    if response != "":
#        print("response lleno")
#        if isinstance(response, dict):
#            if "access_token" in response:
#                picture, login_name, id = get_user_data(request, response)
#                if not picture and not login_name and not id:
#                    return home(request)
#                else:
#                    register_user(request, login_name, id, response)
#    else:
#        print("response vacio")
#        return login(request)
    return render(request, 'home.html', {'picture': ""})


def loginPage(request):
    return render(request, 'login.html')