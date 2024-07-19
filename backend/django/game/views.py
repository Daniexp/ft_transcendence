from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
from home import views
import requests
from os import environ as env
import json

def gameButtons(request):
    return render(request, 'gameButtonsDisplay.html')