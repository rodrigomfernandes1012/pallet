from django.urls import path
from app_controller import views
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # --- SEÇÃO DE AUTENTICAÇÃO CORRIGIDA ---
    path('', views.login, name='login'),

    path('logout/', views.custom_logout, name='logout'),
    path('cadastro/', views.cadastrar_pessoa_juridica, name='cadastrar_pessoa_juridica'),

    # PÁGINAS PRIVADAS (protegidas por login_required)
    path('painel/', login_required(views.painel_usuario), name='painel_usuario'),

    # CLIENTES 
    #Login_required (cadastrados)
    path('clientes/', login_required(views.cliente_listar), name='cliente_listar'),
    path('clientes/cadastrar/', login_required(views.cliente_cadastrar), name='cliente_cadastrar'),
    path('clientes/editar/<int:id>/', login_required(views.cliente_editar), name='cliente_editar'),
    path('clientes/remover/<int:id>/', views.staff_required(views.cliente_remover), name='cliente_remover'),

    # MOTORISTAS
    #Login_required (cadastrados)
    path('motoristas/', login_required(views.motorista_listar), name='motorista_listar'),
    path('motoristas/cadastrar/', login_required(views.motorista_cadastrar), name='motorista_cadastrar'),
    path('motoristas/editar/<int:id>/', login_required(views.motorista_editar), name='motorista_editar'),
    path('motoristas/remover/<int:id>/', views.staff_required(views.motorista_remover), name='motorista_remover'),
    

    # TRANSPORTADORAS 
    #Login_required (cadastrados)
    path('transportadoras/', login_required(views.transportadora_listar), name='transportadora_listar'),
    path('transportadoras/cadastrar/', login_required(views.transportadora_cadastrar), name='transportadora_cadastrar'),
    path('transportadoras/editar/<int:id>/', login_required(views.transportadora_editar), name='transportadora_editar'),
    path('transportadoras/remover/<int:id>/', views.staff_required(views.transportadora_remover), name='transportadora_remover'),
    
    
    # VALE PALLET
    #Login_required (cadastrados)
    path('vales/', login_required(views.valepallet_listar), name='valepallet_listar'),
    path('vales/cadastrar/', login_required(views.valepallet_cadastrar), name='valepallet_cadastrar'),
    path('vales/detalhes/<int:id>/', login_required(views.valepallet_detalhes), name='valepallet_detalhes'),
    path('vales/editar/<int:id>/', login_required(views.valepallet_editar), name='valepallet_editar'),
    path('vales/remover/<int:id>/', views.staff_required(views.valepallet_remover), name='valepallet_remover'),
    path('valepallet/processar/<int:id>/<str:hash_seguranca>/', views.staff_required(views.processar_scan), name='valepallet_processar'),

    # MOVIMENTAÇÕES
    path('movimentacoes/', views.staff_required(views.movimentacao_listar), name='movimentacao_listar'),
    path('movimentacoes/filtrar/', views.staff_required(views.movimentacoes_filtrar), name='movimentacoes_filtrar'),
    path('dashboard/filtrar/', views.dashboard_filtrar, name='dashboard_filtrar'),
    
    # APIs
    path('api/validarCNPJ/', views.validar_cnpj_api, name='validar_cnpj_api'),
    path('api/consultarCEP/', views.consultar_cep_api, name='consultar_cep_api'),
    path('api/estados/', views.listar_estados_api, name='listar_estados_api'),
    path('api/municipios/<str:uf>/', views.listar_municipios_api, name='listar_municipios_api'),
    
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)