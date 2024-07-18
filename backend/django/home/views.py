from django.shortcuts import render
from . import models
from django.contrib.auth.decorators import login_required
import os
from login import views as loginViews


# Create your views here.

def login(request):
    return render(request, "index.html")

#DECLAEANDO LA VISTA PARA LA REQUEST ENTRANTE
def somethingHappened(request):
    print("HEADERS:")
    print(request.headers)
    return render(request, 'aux.html')


def home(request, response = ""):
    print("AAA")
    print(response)
    if response != "":
        if response.status_code == 200 and "access_token" in response.json():
            picture = loginViews.getProfilePicture(response)
            print("FOTO")
            return render(request, 'home.html', {'picture': picture})
        else:
            return home(request)
    else:
        return login(request)


def loginPage(request):
    return render(request, 'login.html')