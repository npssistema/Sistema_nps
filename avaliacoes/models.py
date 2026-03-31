from django.db import models


class Avaliacao(models.Model):

    os_numero = models.CharField(
        max_length=50,
        verbose_name="Número da OS"
    )

    equipamento = models.CharField(
        max_length=200,
        verbose_name="Equipamento"
    )

    marca = models.CharField(
        max_length=150,
        verbose_name="Marca"
    )

    modelo = models.CharField(
        max_length=150,
        verbose_name="Modelo"
    )

    localizacao = models.CharField(
        max_length=200,
        verbose_name="Localização"
    )

    orgao = models.CharField(
        max_length=200,
        verbose_name="Órgão"
    )

    data = models.DateField(
        verbose_name="Data da Manutenção"
    )

    q1 = models.IntegerField(
        verbose_name="1. Como você avalia o serviço do conserto realizado nesta OS?"
    )

    q2 = models.IntegerField(
        verbose_name="2. Como você avalia o técnico (postura, educação e clareza) que realizou o serviço?"
    )

    q3 = models.IntegerField(
        verbose_name="3. No geral, como você avalia o suporte e o atendimento do setor de Engenharia Clínica?"
    )

    comentario = models.TextField(
        blank=True,
        null=True,
        verbose_name="Comentário / Sugestão"
    )

    registrado_por = models.CharField(
        max_length=200,
        verbose_name="Nome de quem registrou"
    )

    def __str__(self):
        return f"OS {self.os_numero} - {self.equipamento} ({self.data})"

    class Meta:
        verbose_name = "Avaliação"
        verbose_name_plural = "Avaliações"
        ordering = ["-data"]
