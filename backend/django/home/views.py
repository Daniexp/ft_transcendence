from django.shortcuts import render, redirect
from os import environ as env
import requests
from django.contrib.auth.decorators import login_required
import os
from login import views as loginViews
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.models import User as UserData


class PongUser:
    def __init__(self, username, uid, api_data):
        self.username = username
        self.is_authenticated = True
        self.uid = uid
        self.api_data = api_data

    def __str__(self):
        return self.username

# Create your views here.

def login(request):
    return render(request, "index.html")

#DECLAEANDO LA VISTA PARA LA REQUEST ENTRANTE
def somethingHappened(request):
    return render(request, 'aux.html')

def logout(request):
    if (request.user.is_authenticated):
        auth_logout(request)
    return redirect('/')

def get_user_data(request, response):
    data_request = requests.get("https://api.intra.42.fr/v2/me", data=response)
    picture = loginViews.getProfilePicture(data_request)
    id = loginViews.getId(data_request)
    login_name = loginViews.getLogin(data_request)
    return picture, login_name, id


def home(request, response = ""):
    if response != "":
        print("response lleno")
        if isinstance(response, dict):
            if "access_token" in response:
                picture, login_name, id = get_user_data(request, response)
                if not picture and not login_name and not id:
                    return home(request)
                else:
                    print("PRE REGISTER")
                    print(request.user)
                    request.user = PongUser(login_name, id, response)
                    request.user.is_authenticated = 1
                    print("POST REGISTER")
                    print(request.user.is_authenticated)
    else:
        print("response vacio")
        return login(request)
    return render(request, 'home.html', {'picture': picture})


def loginPage(request):
    return render(request, 'login.html')