from django import forms
from django.core.validators import RegexValidator
from django.utils import timezone
from .models import Cliente, Motorista, Transportadora, ValePallet, Movimentacao, Usuario, PessoaJuridica
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

# ===== CONSTANTES DE VALIDAÇÃO =====
CNPJ_REGEX = r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$'
CPF_REGEX = r'^\d{3}\.\d{3}\.\d{3}-\d{2}$'
TELEFONE_REGEX = r'^\(\d{2}\) \d{5}-\d{4}$'

# ===== FORMULÁRIOS PRINCIPAIS =====
class UsuarioPJForm(forms.ModelForm):
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        label="Senha"
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        label="Confirme a Senha"
    )

    tipo_usuario = forms.ChoiceField(
        choices=Usuario.TIPO_USUARIO_CHOICES,
        initial='Cadastro',
        widget=forms.Select(attrs={'class': 'form-select'}),
        required=False
    )
    
    telefone = forms.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\(\d{2}\) \d{4,5}-\d{4}$',
            message='Formato: (00) 00000-0000'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '(00) 00000-0000',
            'data-mask': '(00) 00000-0000'
        })
    )

    class Meta:
        model = Usuario
        fields = ['username', 'email', 'telefone', 'tipo_usuario']
        labels = {
            'username': 'Nome de Usuário*',
            'email': 'Email do Representante*',
        }
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nome de usuário para acesso ao sistema'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'email@representante.com'
            }),
        }

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if Usuario.objects.filter(username=username).exists():
            raise ValidationError('Este nome de usuário já está em uso')
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if Usuario.objects.filter(email=email).exists():
            raise ValidationError('Este email já está cadastrado')
        return email

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError("As senhas não coincidem")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class PessoaJuridicaForm(forms.ModelForm):
    cnpj = forms.CharField(
        max_length=18,
        validators=[RegexValidator(
            regex=r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$',
            message='Formato: 00.000.000/0000-00'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '00.000.000/0000-00',
            'data-mask': '00.000.000/0000-00'
        })
    )
    
    telefone = forms.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\(\d{2}\) \d{4,5}-\d{4}$',
            message='Formato: (00) 00000-0000'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '(00) 00000-0000',
            'data-mask': '(00) 00000-0000'
        })
    )
    
    cep = forms.CharField(
        max_length=9,
        validators=[RegexValidator(
            regex=r'^\d{5}-\d{3}$',
            message='Formato: 00000-000'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '00000-000',
            'data-mask': '00000-000',
            'onblur': 'buscarCEP(this.value)'
        })
    )

    class Meta:
        model = PessoaJuridica
        fields = '__all__'
        widgets = {
            'usuario': forms.HiddenInput(),
            'razao_social': forms.TextInput(attrs={'class': 'form-control'}),
            'nome_fantasia': forms.TextInput(attrs={'class': 'form-control'}),
            'inscricao_estadual': forms.TextInput(attrs={'class': 'form-control'}),
            'inscricao_municipal': forms.TextInput(attrs={'class': 'form-control'}),
            'iest': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'site': forms.URLInput(attrs={
                'class': 'form-control', 
                'placeholder': 'https://',
                'required': False
            }),
            'logradouro': forms.TextInput(attrs={'class': 'form-control'}),
            'numero': forms.TextInput(attrs={'class': 'form-control'}),
            'bairro': forms.TextInput(attrs={'class': 'form-control'}),
            'complemento': forms.TextInput(attrs={'class': 'form-control'}),
            'estado': forms.Select(attrs={
                'class': 'form-select',
                'id': 'estado',
            }),
            'cidade': forms.Select(attrs={
                'class': 'form-select',
                'id': 'cidade',
                'disabled': True
            }),
            'situacao_cadastral': forms.Select(attrs={'class': 'form-select'}),
            'tipo_empresa': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['tipo_empresa'].choices = [('cadastrado', 'cadastrados')]
        self.fields['tipo_empresa'].initial = 'cadastrado'
        self.fields['site'].required = False
        self.fields['usuario'].required = False

    def clean_cnpj(self):
        cnpj = self.cleaned_data.get('cnpj')
        if PessoaJuridica.objects.filter(cnpj=cnpj).exists():
            raise ValidationError('Este CNPJ já está cadastrado')
        return cnpj

    def clean(self):
        cleaned_data = super().clean()
        
        cnpj = cleaned_data.get('cnpj', '').replace('.', '').replace('/', '').replace('-', '')
        if len(cnpj) != 14:
            raise ValidationError({'cnpj': 'CNPJ deve ter 14 dígitos'})
        
        razao_social = cleaned_data.get('razao_social', '')
        if len(razao_social.strip()) < 5:
            raise ValidationError({'razao_social': 'Razão Social deve ter pelo menos 5 caracteres'})
        
        cep = cleaned_data.get('cep', '').replace('-', '')
        if len(cep) != 8:
            raise ValidationError({'cep': 'CEP deve ter 8 dígitos'})
        
        telefone = cleaned_data.get('telefone', '')
        if len(telefone.replace('(', '').replace(')', '').replace(' ', '').replace('-', '')) < 10:
            raise ValidationError({'telefone': 'Telefone deve ter pelo menos 10 dígitos'})
        
        estado = cleaned_data.get('estado')
        cidade = cleaned_data.get('cidade')
        if estado and not cidade:
            raise ValidationError({'cidade': 'Selecione uma cidade para o estado escolhido'})
        
        if not self.instance.pk and cleaned_data.get('situacao_cadastral') != 'Ativo':
            raise ValidationError({
                'situacao_cadastral': 'Novos registros devem estar como "Ativo"'
            })
        
        inscricao_estadual = cleaned_data.get('inscricao_estadual')
        if inscricao_estadual and estado:
            if estado == 'SP' and len(inscricao_estadual) != 12:
                raise ValidationError({
                    'inscricao_estadual': 'Inscrição Estadual de SP deve ter 12 dígitos'
                })
        
        return cleaned_data

class ClienteForm(forms.ModelForm):
    cnpj = forms.CharField(
        validators=[RegexValidator(
            regex=CNPJ_REGEX,
            message='CNPJ inválido (padrão: 00.000.000/0000-00)'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '00.000.000/0000-00'
        })
    )
    
    telefone = forms.CharField(
        validators=[RegexValidator(
            regex=TELEFONE_REGEX,
            message='Telefone inválido (padrão: (00) 00000-0000)'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '(00) 00000-0000'
        })
    )

    email = forms.EmailField(
        label="E-mail",
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'seu@email.com',
        })
    )

    class Meta:
        model = Cliente
        exclude = ['criado_por']
        fields = ['nome', 'cnpj', 'telefone', 'email']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'nome': 'Nome Completo',
            'email': 'E-mail',
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.user and hasattr(self.user, 'pessoajuridica'):
            instance.criado_por = self.user.pessoajuridica
        if commit:
            instance.save()
        return instance


class MotoristaForm(forms.ModelForm):
    cpf = forms.CharField(
        validators=[RegexValidator(
            regex=CPF_REGEX,
            message='CPF inválido (padrão: 000.000.000-00)'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '000.000.000-00'
        })
    )
    
    telefone = forms.CharField(
        validators=[RegexValidator(
            regex=TELEFONE_REGEX,
            message='Telefone inválido (padrão: (00) 00000-0000)'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '(00) 00000-0000'
        })
    )

    class Meta:
        model = Motorista
        exclude = ['criado_por']
        fields = ['nome', 'cpf', 'telefone', 'email']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'nome': 'Nome Completo',
            'email': 'E-mail (opcional)',
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        self.fields['email'].required = False

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.user and hasattr(self.user, 'pessoajuridica'):
            instance.criado_por = self.user.pessoajuridica
        if commit:
            instance.save()
        return instance


class TransportadoraForm(forms.ModelForm):
    
    cnpj = forms.CharField(
        validators=[RegexValidator(
            regex=CNPJ_REGEX,
            message='CNPJ inválido (padrão: 00.000.000/0000-00)'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '00.000.000/0000-00'
        })
    )
    
    telefone = forms.CharField(
        validators=[RegexValidator(
            regex=TELEFONE_REGEX,
            message='Telefone inválido (padrão: (00) 00000-0000)'
        )],
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '(00) 00000-0000'
        })
    )

    email = forms.EmailField(
        label="E-mail",
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'seu@email.com',
        })
    )

    class Meta:
        model = Transportadora
        exclude = ['criado_por']
        fields = ['nome', 'cnpj', 'telefone', 'email']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'nome': 'Nome da Transportadora',
            'email': 'E-mail',
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.user and hasattr(self.user, 'pessoajuridica'):
            instance.criado_por = self.user.pessoajuridica
        if commit:
            instance.save()
        return instance


class ValePalletForm(forms.ModelForm):
    data_validade = forms.DateField(
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'form-control',
            'min': timezone.now().strftime('%Y-%m-%d')
        }),
        initial=timezone.now().date(),
        label="Data de Validade*"
    )

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if self.user and hasattr(self.user, 'pessoa_juridica'): 
            pj = self.user.pessoa_juridica #Aqui é para usuarios PJ
            self.fields['cliente'].queryset = Cliente.objects.filter(criado_por=pj).order_by('nome')
            self.fields['motorista'].queryset = Motorista.objects.filter(criado_por=pj).order_by('nome')
            self.fields['transportadora'].queryset = Transportadora.objects.filter(criado_por=pj).order_by('nome')
        else: 
            self.fields['cliente'].queryset = Cliente.objects.none()
            self.fields['motorista'].queryset = Motorista.objects.none()
            self.fields['transportadora'].queryset = Transportadora.objects.none()
        
        # Estilização dos campos
        for field in self.fields:
            if isinstance(self.fields[field].widget, forms.Select):
                self.fields[field].widget.attrs.update({'class': 'form-select'})
            else:
                self.fields[field].widget.attrs.update({'class': 'form-control'})

    class Meta:
        model = ValePallet
        fields = ['numero_vale', 'cliente', 'motorista', 'transportadora', 
                'data_validade', 'qtd_pbr', 'qtd_chepp','criado_por']
        widgets = {
            'numero_vale': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Use um Numerador para Identificar Ticket'
            }),
            'qtd_pbr': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 1,
                'placeholder': '0'
            }),
            'qtd_chepp': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 1,
                'placeholder': '0'
            }),
        }

    def clean(self):
        cleaned_data = super().clean()
        if not hasattr(self.user, 'pessoa_juridica'):
            raise forms.ValidationError("Usuário não está associado a uma pessoa jurídica")
        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Conversão de data
        if 'data_validade' in self.cleaned_data:
            instance.data_validade = timezone.make_aware(
                timezone.datetime.combine(
                    self.cleaned_data['data_validade'], 
                    timezone.datetime.min.time()
                )
            )
        
        # Garantir que o usuário está definido e é do tipo correto
        if not hasattr(self, 'user') or not self.user:
            raise ValidationError("Usuário não definido ao criar o vale")
        
        if not isinstance(self.user, Usuario):
            raise ValidationError("Tipo de usuário inválido")
        
        if isinstance(self.user, Usuario):
            instance.criado_por = self.user.pessoa_juridica
            if commit:
                instance.save()
            return instance

class MovimentacaoForm(forms.ModelForm):
    data_validade = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={
            'type': 'datetime-local',
            'class': 'form-control'
        }),
        required=False
    )
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if 'instance' in kwargs:
            vale = kwargs['instance'].vale
        else:
            vale = None
        
        if vale:
            self.fields['vale'].queryset = ValePallet.objects.filter(pk=vale.pk)
        else:
            self.fields['vale'].queryset = ValePallet.objects.none()
        
        self.fields['tipo'].widget.attrs.update({'class': 'form-select'})
        self.fields['observacao'].widget.attrs.update({'rows': 3})

    class Meta:
        model = Movimentacao
        exclude = ['criado_por']
        fields = ['vale', 'tipo', 'qtd_pbr', 'qtd_chepp', 'observacao', 'data_validade']
        widgets = {
            'vale': forms.Select(attrs={'class': 'form-select'}),
            'qtd_pbr': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 1
            }),
            'qtd_chepp': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 1
            }),
            'observacao': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3
            }),
        }
        labels = {
            'vale': 'Vale de Pallet',
            'tipo': 'Tipo de Movimentação',
            'observacao': 'Observações',
        }

    def save(self, commit=True):
        instance = super().save(commit=False)
        if isinstance(self.user, Usuario):
            instance.criado_por = self.user.pessoa_juridica
        if commit:
            instance.save()
        return instance