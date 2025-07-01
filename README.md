========================================================================================
**Fluxo de Uso e Permissões da Aplicação**

- Cadastro e Login
0.3 – O usuário realiza o cadastro na área "Cadastre-se".

0.5 – Após o cadastro, o usuário será redirecionado para a tela de Login, onde deve autenticar-se utilizando username e senha.

0.6 – Após o login, o usuário terá acesso a uma área restrita, sendo identificado como usuário autenticado, com permissões para CRUD parcial (Create, Read e Update).

- Sessão e Atribuição de Registros
1.0 – Após o primeiro login, a sessão permanecerá ativa até o usuário realizar o logout manualmente.

1.1 – Cada ação de criação ou edição em formulários será registrada no banco de dados, atribuindo automaticamente o campo "criado_por" com o ID do usuário (Pessoa Jurídica).

---------------------------------------------------------------------------------------
**Permissões de Administradores (Staff)**
1.3 – Usuários com perfil staff (administradores) possuem permissões totais, incluindo:
1.3.5 -Exclusão de vales;
1.3.7 - Alteração de estados/status;
1.3.9 - Emissão e consulta de todos os registros da base de dados.

1.4 – A atualização do status do QR Code é uma ação exclusiva para administradores (is_staff=True).

- Validade dos Vales
1.7 – Todos os vales emitidos terão validade até o final do dia escolhido no momento da emissão.

**Objetivo da Aplicação**
2.0 – Esta aplicação tem como principal objetivo gerenciar de forma centralizada a emissão de vales de pallets, beneficiando tanto os fornecedores quanto os administradores do sistema.
O fluxo facilita o controle, validação e acompanhamento por parte de todos os envolvidos: colaboradores internos, beneficiários e prestadores de serviço.
========================================================================================

Etapas para Rodar e usar o Codigo: 

--- sudo apt update
--- sudo apt install python3
--- sudo apt install postgresql

# Instalando algumas dependencias da aplicação, com o projeto Django.
- sudo apt update
- pip install django psycopg2-binary requests validate-docbr qrcode[pil] python-dotenv supabase
- pip install -r requirements.txt

- Fluxo de Cadastro e Acesso ✅ 
Cadastro:
Usuários realizam o cadastro através da área "Cadastre-se".

Login:
Após o cadastro, o usuário é redirecionado para a tela de Login, onde deve autenticar-se com username e senha.
O sistema mantém a sessão ativa até que o usuário execute o logout manualmente.

Permissões de Usuário Comum:
Usuários autenticados têm acesso a funcionalidades de Create, Read e Update nos módulos autorizados.
Todas as ações realizadas por estes usuários são registradas no banco de dados, atribuindo o campo "criado_por" com o ID da Pessoa Jurídica (usuário responsável).