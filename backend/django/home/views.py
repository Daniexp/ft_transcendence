from django.shortcuts import render
from . import models
from django.contrib.auth.decorators import login_required
import os


# Create your views here.

def login(request):
    return render(request, "login.html")

#DECLAEANDO LA VISTA PARA LA REQUEST ENTRANTE
def somethingHappened(request):
    print("HEADERS:")
    print(request.headers)
    return render(request, 'aux.html')


def loginSuccess(request):
    return render(request, 'home.html')