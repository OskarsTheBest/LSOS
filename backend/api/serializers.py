from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'last_name', 'number', 'user_type']
        extra_kwargs = {
            'user_type': {'default': 'normal'}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'last_name', 'number', 'user_type']


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
    
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'name', 'last_name', 'number', 'user_type', 'is_active', 'create_date']
        read_only_fields = ['id', 'create_date']
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
        