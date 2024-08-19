from django.shortcuts import render, redirect
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

def logout(request):
    print(request.user.login)
    print(request.user.is_active)
    if (request.user.is_authenticated):
        user_api_data = UserRegister.objects.get(login=request.user.login).api_data 
        #Queda revokear el token



        #data_request = requests.get("https://api.intra.42.fr/v2/apps", data=user_api_data)
        #data_request = requests.get("https://api.intra.42.fr/v2/me", data=user_api_data)
        #if (data_request is not 200):
         #   print("Something fail when login out")
          #  return render(request, 'aux.html')
        auth_logout(request)
    print(request.user.is_active)
    return redirect('/')

def home(request, response = ""):
    if response != "":
        if response.status_code == 200 and "access_token" in response.json():
            picture = loginViews.getProfilePicture(response)
            login_name = loginViews.getLogin(response)
            id = loginViews.getId(response)
            #user_data, created = UserRegister.objects.get_or_create(uid=id, login=login_name, api_data=response.json())
            if not UserRegister.objects.filter(uid=id, login=login_name).exists():
                user_data = UserRegister.objects.create(uid=id, login=login_name, api_data=response.json())
                user_data.backend = 'django.contrib.auth.backends.ModelBackend' 
            else:
                user_data = UserRegister.objects.get(uid=id, login=login_name)
                user_data.api_data = response.json()
            user_data.save()
            auth_login(request, user_data)
            #request.user = user_data
            return render(request, 'home.html', {'picture': picture})
        else:
            return home(request)
    else:
        return login(request)


def loginPage(request):
    return render(request, 'login.html')