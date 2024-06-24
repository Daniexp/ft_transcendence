from django.shortcuts import render
from . import models

# Create your views here.

def index(request):
    return render(request, "index.html")

#DECLAEANDO LA VISTA PARA LA REQUEST ENTRANTE
def somethingHappened(request):
    return render(request, 'aux.html')


def loginSuccess(request):
    return render(request, 'aux.html')