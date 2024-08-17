from django.shortcuts import render
from . import models
from django.contrib.auth.decorators import login_required
import os
from login import views as loginViews
from login.models import User as pongdb


# Create your views here.

def login(request):
    return render(request, "index.html")

#DECLAEANDO LA VISTA PARA LA REQUEST ENTRANTE
def somethingHappened(request):
    return render(request, 'aux.html')


def home(request, response = ""):
    if response != "":
        if response.status_code == 200 and "access_token" in response.json():
            picture = loginViews.getProfilePicture(response)
            login = loginViews.getLogin(response)
            id = loginViews.getId(response)
            user_data, created = pongdb.objects.get_or_create(uid=id, login=login)
            if (not created):
                user_data.save()
            return render(request, 'home.html', {'picture': picture})
        else:
            return home(request)
    else:
        return login(request)


def loginPage(request):
    return render(request, 'login.html')