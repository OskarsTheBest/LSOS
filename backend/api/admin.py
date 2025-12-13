from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Skola, Prieksmets, Olimpiade, Pieteikums, Rezultats, SkolasStarp


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'vards', 'uzvards', 'tips', 'skola', 'is_active']
    list_filter = ['tips', 'is_active', 'is_staff']
    search_fields = ['email', 'vards', 'uzvards']
    ordering = ['email']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Papildu informācija', {
            'fields': ('vards', 'uzvards', 'talrNumurs', 'tips', 'skola', 'name', 'last_name', 'number', 'user_type')
        }),
    )


@admin.register(Skola)
class SkolaAdmin(admin.ModelAdmin):
    list_display = ['nosaukums', 'pasvaldiba', 'adrese']
    search_fields = ['nosaukums', 'pasvaldiba', 'adrese']


@admin.register(Prieksmets)
class PrieksmetsAdmin(admin.ModelAdmin):
    list_display = ['nosaukums', 'kategorija']
    search_fields = ['nosaukums', 'kategorija']


@admin.register(Olimpiade)
class OlimpiadeAdmin(admin.ModelAdmin):
    list_display = ['nosaukums', 'datums', 'norisesVieta', 'organizetajs', 'prieksmets']
    list_filter = ['datums', 'prieksmets']
    search_fields = ['nosaukums', 'norisesVieta', 'organizetajs']
    date_hierarchy = 'datums'


@admin.register(Pieteikums)
class PieteikumsAdmin(admin.ModelAdmin):
    list_display = ['lietotajs', 'olimpiade', 'statuss', 'pieteikumaDatums']
    list_filter = ['statuss', 'pieteikumaDatums']
    search_fields = ['lietotajs__email', 'olimpiade__nosaukums']
    date_hierarchy = 'pieteikumaDatums'


@admin.register(Rezultats)
class RezultatsAdmin(admin.ModelAdmin):
    list_display = ['olimpiade', 'lietotajs', 'vieta', 'punktuSkaits', 'rezultataDatums']
    list_filter = ['olimpiade', 'rezultataDatums']
    search_fields = ['olimpiade__nosaukums', 'lietotajs__email']
    date_hierarchy = 'rezultataDatums'


@admin.register(SkolasStarp)
class SkolasStarpAdmin(admin.ModelAdmin):
    list_display = ['skolas', 'olimpiades']
    list_filter = ['skolas', 'olimpiades']
    search_fields = ['skolas__nosaukums', 'olimpiades__nosaukums']
