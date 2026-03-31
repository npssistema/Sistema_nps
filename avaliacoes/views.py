from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Avg
from django.db.models.functions import TruncDate

from .models import Avaliacao


# ===============================
# HOME
# ===============================
def home(request):
    return render(request, "home.html")


# ===============================
# CADASTRAR AVALIAÇÃO
# ===============================
def cadastrar(request):
    if request.method == "POST":
        os_numero = request.POST.get("os_numero")
        equipamento = request.POST.get("equipamento")
        marca = request.POST.get("marca")
        modelo = request.POST.get("modelo")
        localizacao = request.POST.get("localizacao")
        orgao = request.POST.get("orgao")
        data = request.POST.get("data")

        q1 = request.POST.get("q1")
        q2 = request.POST.get("q2")
        q3 = request.POST.get("q3")

        comentario = request.POST.get("comentario")
        registrado_por = request.POST.get("registrado_por")

        if not all([os_numero, equipamento, marca, modelo, localizacao, orgao, data, q1, q2, q3, registrado_por]):
            return render(request, "cadastrar.html", {
                "erro": "⚠ Preencha todos os campos obrigatórios!"
            })

        Avaliacao.objects.create(
            os_numero=os_numero,
            equipamento=equipamento,
            marca=marca,
            modelo=modelo,
            localizacao=localizacao,
            orgao=orgao,
            data=data,
            q1=int(q1),
            q2=int(q2),
            q3=int(q3),
            comentario=comentario,
            registrado_por=registrado_por
        )

        return redirect("historico")

    return render(request, "cadastrar.html")


# ===============================
# EXCLUIR AVALIAÇÃO
# ===============================
def excluir_avaliacao(request, id):
    avaliacao = get_object_or_404(Avaliacao, id=id)

    if request.method == "POST":
        avaliacao.delete()

    return redirect("historico")


# ===============================
# FUNÇÃO AUXILIAR DE CLASSIFICAÇÃO
# ===============================
def classificar_q3(q3):
    if q3 >= 4:
        return "promotor"
    elif q3 == 3:
        return "neutro"
    return "detrator"


# ===============================
# HISTÓRICO DE AVALIAÇÕES
# ===============================
def historico(request):
    filtro_os = request.GET.get("os")
    filtro_data_inicio = request.GET.get("data_inicio")
    filtro_data_fim = request.GET.get("data_fim")
    filtro_equipamento = request.GET.get("equipamento")
    filtro_marca = request.GET.get("marca")
    filtro_modelo = request.GET.get("modelo")
    filtro_orgao = request.GET.get("orgao")
    filtro_localizacao = request.GET.get("localizacao")
    filtro_classificacao = request.GET.get("classificacao")

    avaliacoes = Avaliacao.objects.all().order_by("-data", "-id")

    if filtro_os:
        avaliacoes = avaliacoes.filter(os_numero__icontains=filtro_os)

    if filtro_data_inicio:
        avaliacoes = avaliacoes.filter(data__gte=filtro_data_inicio)

    if filtro_data_fim:
        avaliacoes = avaliacoes.filter(data__lte=filtro_data_fim)

    if filtro_equipamento:
        avaliacoes = avaliacoes.filter(equipamento__icontains=filtro_equipamento)

    if filtro_marca:
        avaliacoes = avaliacoes.filter(marca__icontains=filtro_marca)

    if filtro_modelo:
        avaliacoes = avaliacoes.filter(modelo__icontains=filtro_modelo)

    if filtro_orgao:
        avaliacoes = avaliacoes.filter(orgao__icontains=filtro_orgao)

    if filtro_localizacao:
        avaliacoes = avaliacoes.filter(localizacao__icontains=filtro_localizacao)

    avaliacoes_filtradas = []

    for a in avaliacoes:
        a.classificacao = classificar_q3(a.q3)

        if filtro_classificacao:
            if a.classificacao == filtro_classificacao:
                avaliacoes_filtradas.append(a)
        else:
            avaliacoes_filtradas.append(a)

    return render(request, "historico.html", {
        "avaliacoes": avaliacoes_filtradas,
        "filtro_os": filtro_os or "",
        "filtro_data_inicio": filtro_data_inicio or "",
        "filtro_data_fim": filtro_data_fim or "",
        "filtro_equipamento": filtro_equipamento or "",
        "filtro_marca": filtro_marca or "",
        "filtro_modelo": filtro_modelo or "",
        "filtro_orgao": filtro_orgao or "",
        "filtro_localizacao": filtro_localizacao or "",
        "filtro_classificacao": filtro_classificacao or ""
    })


# ===============================
# DASHBOARD / GRÁFICOS
# ===============================
def graficos(request):
    filtro_equipamento = request.GET.get("equipamento")
    filtro_marca = request.GET.get("marca")
    filtro_modelo = request.GET.get("modelo")
    filtro_orgao = request.GET.get("orgao")
    filtro_localizacao = request.GET.get("localizacao")
    filtro_data_inicio = request.GET.get("data_inicio")
    filtro_data_fim = request.GET.get("data_fim")
    filtro_classificacao = request.GET.get("classificacao")

    avaliacoes = Avaliacao.objects.all().order_by("data", "id")

    if filtro_equipamento:
        avaliacoes = avaliacoes.filter(equipamento__icontains=filtro_equipamento)

    if filtro_marca:
        avaliacoes = avaliacoes.filter(marca__icontains=filtro_marca)

    if filtro_modelo:
        avaliacoes = avaliacoes.filter(modelo__icontains=filtro_modelo)

    if filtro_orgao:
        avaliacoes = avaliacoes.filter(orgao__icontains=filtro_orgao)

    if filtro_localizacao:
        avaliacoes = avaliacoes.filter(localizacao__icontains=filtro_localizacao)

    if filtro_data_inicio:
        avaliacoes = avaliacoes.filter(data__gte=filtro_data_inicio)

    if filtro_data_fim:
        avaliacoes = avaliacoes.filter(data__lte=filtro_data_fim)

    avaliacoes_filtradas = []
    for a in avaliacoes:
        classificacao = classificar_q3(a.q3)

        if filtro_classificacao:
            if classificacao == filtro_classificacao:
                avaliacoes_filtradas.append(a)
        else:
            avaliacoes_filtradas.append(a)

    total_avaliacoes = len(avaliacoes_filtradas)

    if total_avaliacoes > 0:
        media_q1 = round(sum(a.q1 for a in avaliacoes_filtradas) / total_avaliacoes, 2)
        media_q2 = round(sum(a.q2 for a in avaliacoes_filtradas) / total_avaliacoes, 2)
        media_q3 = round(sum(a.q3 for a in avaliacoes_filtradas) / total_avaliacoes, 2)
        satisfacao_geral = round((media_q1 + media_q2 + media_q3) / 3, 2)
    else:
        media_q1 = 0
        media_q2 = 0
        media_q3 = 0
        satisfacao_geral = 0

    promotores = sum(1 for a in avaliacoes_filtradas if a.q3 >= 4)
    neutros = sum(1 for a in avaliacoes_filtradas if a.q3 == 3)
    detratores = sum(1 for a in avaliacoes_filtradas if a.q3 <= 2)

    if total_avaliacoes > 0:
        perc_promotores = round((promotores / total_avaliacoes) * 100, 2)
        perc_neutros = round((neutros / total_avaliacoes) * 100, 2)
        perc_detratores = round((detratores / total_avaliacoes) * 100, 2)
        nps = round(perc_promotores - perc_detratores, 2)
    else:
        perc_promotores = 0
        perc_neutros = 0
        perc_detratores = 0
        nps = 0

    # agrupar por data completa
    agrupado = {}

    for a in avaliacoes_filtradas:
        chave = a.data.strftime("%d/%m/%Y")

        if chave not in agrupado:
            agrupado[chave] = {
                "soma_q1": 0,
                "soma_q2": 0,
                "soma_q3": 0,
                "quantidade": 0,
                "data_obj": a.data,
            }

        agrupado[chave]["soma_q1"] += a.q1
        agrupado[chave]["soma_q2"] += a.q2
        agrupado[chave]["soma_q3"] += a.q3
        agrupado[chave]["quantidade"] += 1

    itens_ordenados = sorted(agrupado.items(), key=lambda item: item[1]["data_obj"])

    labels_completos = []
    dados_q1_completos = []
    dados_q2_completos = []
    dados_q3_completos = []

    for data_str, info in itens_ordenados:
        qtd = info["quantidade"]
        labels_completos.append(data_str)
        dados_q1_completos.append(round(info["soma_q1"] / qtd, 2))
        dados_q2_completos.append(round(info["soma_q2"] / qtd, 2))
        dados_q3_completos.append(round(info["soma_q3"] / qtd, 2))

    max_pontos = 6
    total_pontos = len(labels_completos)

    if total_pontos <= max_pontos:
        labels = labels_completos
        dados_q1 = dados_q1_completos
        dados_q2 = dados_q2_completos
        dados_q3 = dados_q3_completos
    else:
        indices = []
        for i in range(max_pontos):
            indice = round(i * (total_pontos - 1) / (max_pontos - 1))
            if indice not in indices:
                indices.append(indice)

        labels = [labels_completos[i] for i in indices]
        dados_q1 = [dados_q1_completos[i] for i in indices]
        dados_q2 = [dados_q2_completos[i] for i in indices]
        dados_q3 = [dados_q3_completos[i] for i in indices]

        # pegar a última avaliação real (já filtrada)
    if avaliacoes_filtradas:
        ultima_data = max(a.data for a in avaliacoes_filtradas)
        ultima_avaliacao = ultima_data.strftime("%d/%m/%Y")
    else:
        ultima_avaliacao = "-"

    # 5 equipamentos com piores críticas pela satisfação geral
    equipamentos_agrupados = {}

    for a in avaliacoes_filtradas:
        if a.equipamento not in equipamentos_agrupados:
            equipamentos_agrupados[a.equipamento] = {
                "soma": 0,
                "quantidade": 0
            }

        media_avaliacao = round((a.q1 + a.q2 + a.q3) / 3, 2)
        equipamentos_agrupados[a.equipamento]["soma"] += media_avaliacao
        equipamentos_agrupados[a.equipamento]["quantidade"] += 1

    piores_equipamentos = []

    for nome, info in equipamentos_agrupados.items():
        media_final = info["soma"] / info["quantidade"]
        piores_equipamentos.append((nome, media_final))

    piores_equipamentos.sort(key=lambda x: x[1])
    piores_equipamentos = piores_equipamentos[:5]

    piores_equipamentos_labels = [item[0] for item in piores_equipamentos]
    piores_equipamentos_medias = [item[1] for item in piores_equipamentos]

    # 5 órgãos/setores com piores críticas pela satisfação geral
    orgaos_agrupados = {}

    for a in avaliacoes_filtradas:
        if a.orgao not in orgaos_agrupados:
            orgaos_agrupados[a.orgao] = {
                "soma": 0,
                "quantidade": 0
            }

        media_avaliacao = round((a.q1 + a.q2 + a.q3) / 3, 2)
        orgaos_agrupados[a.orgao]["soma"] += media_avaliacao
        orgaos_agrupados[a.orgao]["quantidade"] += 1

    piores_orgaos = []

    for nome, info in orgaos_agrupados.items():
        media_final = info["soma"] / info["quantidade"]
        piores_orgaos.append((nome, media_final))

    piores_orgaos.sort(key=lambda x: x[1])
    piores_orgaos = piores_orgaos[:5]

    piores_orgaos_labels = [item[0] for item in piores_orgaos]
    piores_orgaos_medias = [item[1] for item in piores_orgaos]

    from datetime import timedelta
    from django.utils import timezone

    avaliacoes_criticas = [
        a for a in avaliacoes_filtradas
        if ((a.q1 + a.q2 + a.q3) / 3) < 3
    ]

    if total_avaliacoes > 0:
        perc_criticas = (len(avaliacoes_criticas) / total_avaliacoes) * 100
    else:
        perc_criticas = 0

    hoje = timezone.now().date()
    data_limite = hoje - timedelta(days=15)

    criticas_ultimos_15 = sum(
        1 for a in avaliacoes_filtradas
        if a.data >= data_limite and ((a.q1 + a.q2 + a.q3) / 3) < 3
    )

        # 10 comentários mais recentes (somente se não forem vazios)
    comentarios_recentes = sorted(
        [
            a for a in avaliacoes_filtradas
            if a.comentario and str(a.comentario).strip()
        ],
        key=lambda x: (x.data, x.id),
        reverse=True
    )[:10]  

    return render(request, "graficos.html", {
        "total_avaliacoes": total_avaliacoes,
        "satisfacao_geral": satisfacao_geral,
        "media_q1": media_q1,
        "media_q2": media_q2,
        "media_q3": media_q3,
        "nps": nps,
        "perc_promotores": perc_promotores,
        "perc_neutros": perc_neutros,
        "perc_detratores": perc_detratores,
        "labels": labels,
        "dados_q1": dados_q1,
        "dados_q2": dados_q2,
        "dados_q3": dados_q3,
        "filtro_equipamento": filtro_equipamento or "",
        "filtro_marca": filtro_marca or "",
        "filtro_modelo": filtro_modelo or "",
        "filtro_orgao": filtro_orgao or "",
        "filtro_localizacao": filtro_localizacao or "",
        "filtro_data_inicio": filtro_data_inicio or "",
        "filtro_data_fim": filtro_data_fim or "",
        "filtro_classificacao": filtro_classificacao or "",
        "ultima_avaliacao": ultima_avaliacao,
        "piores_equipamentos_labels": piores_equipamentos_labels,
        "piores_equipamentos_medias": piores_equipamentos_medias,
        "piores_orgaos_labels": piores_orgaos_labels,
        "piores_orgaos_medias": piores_orgaos_medias,
        "perc_criticas": round(perc_criticas, 2),
        "criticas_ultimos_15": criticas_ultimos_15,
        "comentarios_recentes": comentarios_recentes,
    })