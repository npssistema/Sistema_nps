from django.contrib import admin
from .models import Avaliacao


@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'os_numero',
        'equipamento',
        'marca',
        'modelo',
        'localizacao',
        'orgao',
        'data',
        'q1',
        'q2',
        'q3',
        'registrado_por'
    )

    list_filter = ('data', 'orgao', 'localizacao', 'equipamento', 'marca')

    search_fields = ('os_numero', 'equipamento', 'marca', 'modelo', 'localizacao', 'orgao')

    ordering = ('-data',)
