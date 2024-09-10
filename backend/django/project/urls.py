"""
URL configuration for project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from home import views
from login import views as loginViews
from game import views as gameViews

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", views.home , name='index'),
    path("logout/", views.logout, name='logout'),
    path("login/", loginViews.intraLogin, name="authentication"),
    path("loginPage/", views.loginPage , name="authentication"),
    path("somethingHappened/", views.somethingHappened, name='somethingHappened'),
    path("auth/callback", loginViews.authRequest, name='loginSuccess'),
    path("gameButtonsDisplay/", gameViews.gameButtons , name='gameButtons'),
]

#https://patata.com/admin/dfrwfwefwewefwfe