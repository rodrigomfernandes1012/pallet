from django.db import models
import secrets
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, RegexValidator
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import AbstractUser, Group, Permission
from validate_docbr import CPF, CNPJ
from django.conf import settings


# Validações reutilizáveis
telefone_validator = RegexValidator(
    regex=r'^\(\d{2}\) \d{4,5}-\d{4}$',
    message="Formato: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX"
)


class Usuario(AbstractUser):
    TIPO_USUARIO_CHOICES = [
        ('Administrador', 'Administradores'),
        ('Cadastro', 'Cadastrados'),
    ]
    
    tipo_usuario = models.CharField(
        max_length=15,
        choices=TIPO_USUARIO_CHOICES,
        default='Cadastro'
    )
    
    telefone = models.CharField(
        max_length=15,
        validators=[telefone_validator]
    )
    
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        related_name='app_controller_usuario_set',
        related_query_name='app_controller_usuario',
    )
    
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        related_name='app_controller_usuario_set',
        related_query_name='app_controller_usuario',
    )
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        constraints = [
            models.UniqueConstraint(
                fields=['username'],
                name='unique_username'
            ),
            models.UniqueConstraint(
                fields=['email'],
                name='unique_email'
            )
        ]

    def __str__(self):
        return self.username
    
    def tem_permissao_global(self):
        """Verifica se usuário tem permissões de staff/superuser"""
        return self.is_staff or self.is_superuser
    
    def pode_remover(self, objeto):
        """Verifica se usuário pode remover um objeto específico"""
        if self.tem_permissao_global():
            return True
        if hasattr(self, 'pessoa_juridica') and hasattr(objeto, 'criado_por'):
            return objeto.criado_por == self.pessoa_juridica
        return False
    
class PessoaJuridica(models.Model):
    SITUACAO_CHOICES = [
        ('Ativo', 'Ativo'),
        ('Inativo', 'Inativo'),
        ('Suspenso', 'Suspenso'),
    ]
    
    # Mantendo exatamente como estava seu TIPO_EMPRESA_CHOICES original
    TIPO_EMPRESA_CHOICES = [
        ('cadastrado', 'cadastrados'),
    ]
    
    # Correção principal: relacionamento com Usuario
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='pessoa_juridica',  # Permite acessar via usuario.pessoa_juridica
        verbose_name='Usuário responsável'
    )
    
    # Todos os outros campos mantidos EXATAMENTE como no seu original
    razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255, blank=True, null=True)
    cnpj = models.CharField(
        max_length=18,
        unique=True,
        validators=[RegexValidator(
            regex=r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$',
            message='CNPJ inválido. Formato: 00.000.000/0000-00'
        )]
    )
    inscricao_estadual = models.CharField(max_length=20, blank=True, null=True)
    inscricao_municipal = models.CharField(max_length=20, blank=True, null=True)
    iest = models.CharField(max_length=20, blank=True, null=True)
    telefone = models.CharField(max_length=15)
    email = models.EmailField()
    site = models.URLField(blank=True, null=True)
    cep = models.CharField(max_length=9)
    logradouro = models.CharField(max_length=255)
    numero = models.CharField(max_length=10)
    bairro = models.CharField(max_length=100)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2)
    cidade = models.CharField(max_length=100)
    situacao_cadastral = models.CharField(
        max_length=10, 
        choices=SITUACAO_CHOICES, 
        default='Ativo'
    )
    tipo_empresa = models.CharField(
        max_length=10, 
        choices=TIPO_EMPRESA_CHOICES, 
        blank=True, 
        null=True
    )
    
    def __str__(self):
        return self.razao_social


class Cliente(models.Model):
    nome = models.CharField(
        max_length=255,
        verbose_name=_("Nome Completo"),
        help_text=_("Razão Social ou Nome Completo")
    )
    cnpj = models.CharField(
        max_length=18,
        unique=True,
        verbose_name=_("CNPJ"),
        validators=[MinLengthValidator(14)],
        help_text=_("Formato: 00.000.000/0000-00")
    )
    telefone = models.CharField(
        max_length=20,
        verbose_name=_("Telefone"),
        validators=[telefone_validator]
    )
    email = models.EmailField(
        verbose_name=_("E-mail"),
        blank=True,
        null=True
    )
    criado_por = models.ForeignKey(
        PessoaJuridica,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Criado por"
    )

    class Meta:
        verbose_name = _("Cliente")
        verbose_name_plural = _("Clientes")
        ordering = ['nome']
        indexes = [
            models.Index(fields=['nome']),
            models.Index(fields=['cnpj']),
        ]

    def __str__(self):
        return self.nome

    def clean(self):
        cnpj = CNPJ()
        if not cnpj.validate(self.cnpj):
            raise ValidationError(_("CNPJ inválido"))


class Motorista(models.Model):
    nome = models.CharField(
        max_length=255,
        verbose_name=_("Nome Completo")
    )
    cpf = models.CharField(
        max_length=14,
        unique=True,
        verbose_name=_("CPF"),
        validators=[MinLengthValidator(11)],
        help_text=_("Formato: 000.000.000-00")
    )
    telefone = models.CharField(
        max_length=20,
        verbose_name=_("Telefone"),
        validators=[telefone_validator]
    )
    email = models.EmailField(
        verbose_name=_("E-mail"),
        blank=True,
        null=True
    )
    criado_por = models.ForeignKey(
        PessoaJuridica,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Criado por"
    )

    class Meta:
        verbose_name = _("Motorista")
        verbose_name_plural = _("Motoristas")
        ordering = ['nome']
        indexes = [
            models.Index(fields=['nome']),
            models.Index(fields=['cpf']),
        ]

    def __str__(self):
        return f"{self.nome} ({self.cpf})"

    def clean(self):
        cpf = CPF()
        if not cpf.validate(self.cpf):
            raise ValidationError(_("CPF inválido"))


class Transportadora(models.Model):
    nome = models.CharField(
        max_length=255,
        verbose_name=_("Nome da Transportadora")
    )
    cnpj = models.CharField(
        max_length=18,
        unique=True,
        verbose_name=_("CNPJ"),
        validators=[MinLengthValidator(14)],
        help_text=_("Formato: 00.000.000/0000-00")
    )
    telefone = models.CharField(
        max_length=20,
        verbose_name=_("Telefone"),
        validators=[telefone_validator]
    )
    email = models.EmailField(
        verbose_name=_("E-mail"),
        blank=True,
        null=True
    )
    criado_por = models.ForeignKey(
        PessoaJuridica,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Criado por"
    )

    class Meta:
        verbose_name = _("Transportadora")
        verbose_name_plural = _("Transportadoras")
        ordering = ['nome']
        indexes = [
            models.Index(fields=['nome']),
            models.Index(fields=['cnpj']),
        ]

    def __str__(self):
        return self.nome

    def clean(self):
        cnpj = CNPJ()
        if not cnpj.validate(self.cnpj):
            raise ValidationError(_("CNPJ inválido"))


class ValePallet(models.Model):
    ESTADO_CHOICES = [
        ('EMITIDO', 'Emitido'),
        ('SAIDA', 'Saida'),
        ('RETORNO', 'Retorno'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    numero_vale = models.CharField(max_length=50, unique=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    motorista = models.ForeignKey(Motorista, on_delete=models.PROTECT)
    transportadora = models.ForeignKey(Transportadora, on_delete=models.PROTECT)
    data_emissao = models.DateTimeField(auto_now_add=True)
    data_validade = models.DateTimeField()
    qtd_pbr = models.PositiveIntegerField(default=0)
    qtd_chepp = models.PositiveIntegerField(default=0)
    qr_code = models.ImageField(upload_to='qrcodes/', blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='EMITIDO')
    observacoes = models.TextField(blank=True, null=True)
    hash_seguranca = models.CharField(max_length=32, unique=True, editable=False)
    criado_por = models.ForeignKey(
        PessoaJuridica,
        db_column='criado_por',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name="Criado por",
        related_name='vales_criados'
    )
    
    usuario_saida = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vales_saida',
        verbose_name="Usuário da saída"
    )
    
    usuario_retorno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='vales_retorno',
        verbose_name="Usuario Retorno"
    )

    data_saida = models.DateTimeField(null=True, blank=True)
    data_retorno = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-data_emissao']
        verbose_name = 'Vale Pallet'
        verbose_name_plural = 'Vales Pallets'
    
    def __str__(self):
        return f"Vale {self.numero_vale} - {self.cliente.nome}"
        
    @property
    def esta_vencido(self):
        hoje = timezone.now().date()
        data_validade = self.data_validade.date()
        return hoje > data_validade
    
    def gerar_hash(self):
        """Gera um hash seguro usando secrets"""
        self.hash_seguranca = secrets.token_hex(16)


class Movimentacao(models.Model):
    TIPO_CHOICES = [
        ('EMITIDO', 'Emitido'),
        ('SAIDA', 'Saida'),
        ('RETORNO', 'Retorno'),
        ('CANCELADO', 'Cancelado'),
        ('SCAN', 'Scan QR Code'),
    ]
    
    vale = models.ForeignKey(ValePallet, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    data_hora = models.DateTimeField(auto_now_add=True)
    data_validade = models.DateTimeField(null=True, blank=True)
    qtd_pbr = models.PositiveIntegerField(default=0)
    qtd_chepp = models.PositiveIntegerField(default=0)
    observacao = models.TextField(blank=True, null=True)
    responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    
    class Meta:
        ordering = ['-data_hora']
        verbose_name = 'Movimentação'
        verbose_name_plural = 'Movimentações'
    
    def __str__(self):
        return f"{self.get_tipo_display()} - Vale {self.vale.numero_vale}"
    
    def save(self, *args, **kwargs):
        if not self.pk:  # Apenas na criação
            if self.tipo == 'EMITIDO':
                self.vale.estado = 'EMITIDO'
            elif self.tipo == 'SAIDA':
                self.vale.estado = 'SAIDA'
            elif self.tipo == 'RETORNO':
                self.vale.estado = 'RETORNO'
            self.vale.save()
        super().save(*args, **kwargs)