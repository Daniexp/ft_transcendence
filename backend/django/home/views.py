from django.shortcuts import render
from . import models
from django.contrib.auth.decorators import login_required
import os


# Create your views here.

def login(request):
    return render(request, "index.html")

#DECLAEANDO LA VISTA PARA LA REQUEST ENTRANTE
def somethingHappened(request):
    print("HEADERS:")
    print(request.headers)
    return render(request, 'aux.html')


def loginSuccess(request, picture):
    return render(request, 'home.html', {'picture': picture})

def loginPage(request):
    return render(request, 'login.html')