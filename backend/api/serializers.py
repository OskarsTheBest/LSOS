from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Skola, Olimpiade, Prieksmets, Pieteikums, Rezultats
import re


def validate_password_strength(password):
    """
    Validates password strength:
    - At least 8 characters
    - At least 1 special symbol
    - At least 1 capital letter
    """
    if len(password) < 8:
        raise serializers.ValidationError("Parolei jābūt vismaz 8 simbolu garai")
    
    if not re.search(r'[A-Z]', password):
        raise serializers.ValidationError("Parolei jāsatur vismaz viens lielais burts")
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
        raise serializers.ValidationError("Parolei jāsatur vismaz viens speciālais simbols")
    
    return password


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'last_name', 'number', 'user_type']
        extra_kwargs = {
            'user_type': {'default': 'normal'}
        }

    def validate_password(self, value):
        return validate_password_strength(value)

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    skola = serializers.PrimaryKeyRelatedField(read_only=True)
    skola_nosaukums = serializers.CharField(source='skola.nosaukums', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'last_name', 'number', 'user_type', 'skola', 'skola_nosaukums', 'create_date']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'last_name', 'number', 'user_type']
        extra_kwargs = {
            'user_type': {'required': False}
        }

    def validate_user_type(self, value):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if request.user.user_type != 'admin':
                raise serializers.ValidationError("Jums nav tiesības veikt šo darbību")
        return value

    def validate_number(self, value):
        if value:
            import re
            phone_regex = re.compile(r'^\+?\d{7,15}$')
            if not phone_regex.match(value):
                raise serializers.ValidationError("Tālruņa numurs neatbilst formātam")
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    skola = serializers.PrimaryKeyRelatedField(queryset=Skola.objects.all(), required=False, allow_null=True)
    skola_nosaukums = serializers.CharField(source='skola.nosaukums', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'name', 'last_name', 'number', 'user_type', 'is_active', 'create_date', 'skola', 'skola_nosaukums']
        read_only_fields = ['id', 'create_date', 'skola_nosaukums']
        extra_kwargs = {
            'email': {'required': False},
            'name': {'required': False},
            'last_name': {'required': False},
            'number': {'required': False},
            'user_type': {'required': False},
        }
    
    def validate_number(self, value):
        if value:
            import re
            phone_regex = re.compile(r'^\+?\d{7,15}$')
            if not phone_regex.match(value):
                raise serializers.ValidationError("Tālruņa numurs neatbilst formātam")
        return value
    
    def validate_email(self, value):
        instance = self.instance
        if instance and instance.email == value:
            return value
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("E-pasts jau tiek izmantots citam profilam")
        return value
    
    def validate_user_type(self, value):
        if value not in ['normal', 'teacher', 'admin']:
            raise serializers.ValidationError("Nepareizs lietotāja tips")
        return value
    
    def validate(self, attrs):
        # Require school for teachers
        if attrs.get('user_type') == 'teacher' and not attrs.get('skola'):
            raise serializers.ValidationError({"skola": "Skolotājiem jābūt pievienotiem skolai"})
        return attrs
    
    def validate_password(self, value):
        if value:
            return validate_password_strength(value)
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({"password": "Parole ir obligāta"})
        user = User.objects.create_user(password=password, **validated_data)
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        return validate_password_strength(value)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Parolēm jāsakrīt"})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Nepareiza vecā parole")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'


class SkolaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skola
        fields = ['id', 'nosaukums', 'pasvaldiba', 'adrese']
        read_only_fields = ['id']


class PrieksmetsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prieksmets
        fields = ['id', 'nosaukums', 'kategorija']
        read_only_fields = ['id']


class OlimpiadeSerializer(serializers.ModelSerializer):
    prieksmets_nosaukums = serializers.CharField(source='prieksmets.nosaukums', read_only=True)
    prieksmets_kategorija = serializers.CharField(source='prieksmets.kategorija', read_only=True)
    
    class Meta:
        model = Olimpiade
        fields = ['id', 'nosaukums', 'datums', 'maxDalibnieki', 'apraksts', 'norisesVieta', 
                  'organizetajs', 'prieksmets', 'prieksmets_nosaukums', 'prieksmets_kategorija']
        read_only_fields = ['id', 'prieksmets_nosaukums', 'prieksmets_kategorija']


class PieteikumsSerializer(serializers.ModelSerializer):
    lietotajs_email = serializers.CharField(source='lietotajs.email', read_only=True)
    lietotajs_name = serializers.CharField(source='lietotajs.name', read_only=True)
    lietotajs_last_name = serializers.CharField(source='lietotajs.last_name', read_only=True)
    lietotajs_skola = serializers.CharField(source='lietotajs.skola.nosaukums', read_only=True)
    olimpiade_nosaukums = serializers.CharField(source='olimpiade.nosaukums', read_only=True)
    olimpiade_datums = serializers.DateField(source='olimpiade.datums', read_only=True)
    
    class Meta:
        model = Pieteikums
        fields = ['id', 'statuss', 'pieteikumaDatums', 'lietotajs', 'olimpiade',
                  'lietotajs_email', 'lietotajs_name', 'lietotajs_last_name', 'lietotajs_skola',
                  'olimpiade_nosaukums', 'olimpiade_datums']
        read_only_fields = ['id', 'pieteikumaDatums', 'lietotajs_email', 'lietotajs_name', 
                           'lietotajs_last_name', 'lietotajs_skola', 'olimpiade_nosaukums', 'olimpiade_datums']


class RezultatsSerializer(serializers.ModelSerializer):
    lietotajs_name = serializers.SerializerMethodField()
    lietotajs_email = serializers.CharField(source='lietotajs.email', read_only=True)
    olimpiade_nosaukums = serializers.CharField(source='olimpiade.nosaukums', read_only=True)
    
    class Meta:
        model = Rezultats
        fields = ['id', 'olimpiade', 'punktuSkaits', 'vieta', 'rezultataDatums', 'lietotajs',
                  'lietotajs_name', 'lietotajs_email', 'olimpiade_nosaukums']
        read_only_fields = ['id', 'olimpiade_nosaukums', 'lietotajs_name', 'lietotajs_email']
    
    def get_lietotajs_name(self, obj):
        if obj.lietotajs:
            name = obj.lietotajs.name or ""
            last_name = obj.lietotajs.last_name or ""
            full_name = f"{name} {last_name}".strip()
            return full_name if full_name else obj.lietotajs.email
        return "Nav norādīts"
        