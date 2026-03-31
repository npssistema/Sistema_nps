from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

    path("cadastrar/", views.cadastrar, name="cadastrar"),

    path("historico/", views.historico, name="historico"),

    path("graficos/", views.graficos, name="graficos"),

    # 🔥 NOVA ROTA DE EXCLUSÃO
    path("excluir-avaliacao/<int:id>/", views.excluir_avaliacao, name="excluir_avaliacao"),
]