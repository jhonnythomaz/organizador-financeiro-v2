# api/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Cliente(models.Model):
    nome_empresa = models.CharField(max_length=200, unique=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome_empresa

class PerfilUsuario(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.usuario.username} -> {self.cliente.nome_empresa}"

class Categoria(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='categorias')
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.nome} ({self.cliente.nome_empresa})"

STATUS_CHOICES = [
    ('Pendente', 'Pendente'),
    ('Pago', 'Pago'),
]

class Pagamento(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pagamentos')
    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_competencia = models.DateField()
    data_vencimento = models.DateField(null=True, blank=True)
    data_pagamento = models.DateField(blank=True, null=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pendente')
    numero_nota_fiscal = models.CharField(max_length=50, blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    @property
    def status_calculado(self):
        if self.status == 'Pago':
            return 'Pago'
        if self.data_vencimento and self.data_vencimento < timezone.now().date():
            return 'Atrasado'
        return 'Pendente'

    def __str__(self):
        return self.descricao