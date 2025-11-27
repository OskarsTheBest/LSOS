from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer, 
    ProfileUpdateSerializer, AdminUserSerializer
)
from .models import User

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ProfileUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileUpdateSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # If user is not admin, remove user_type from request data
        if instance.user_type != 'admin' and 'user_type' in request.data:
            data = request.data.copy()
            data.pop('user_type', None)
        else:
            data = request.data
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Refresh instance to get updated data
        instance.refresh_from_db()
        return Response(UserSerializer(instance).data)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'admin'


class UserListSearchView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-create_date')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(number__icontains=search)
            )
        return queryset


class AdminUserCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()


class AdminUserUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def partial_update(self, request, *args, **kwargs):
        # Allow partial updates for user_type changes
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)  # Always use partial for admin updates
        instance = self.get_object()
        
        # Only update the specific instance
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        # Refresh instance to get updated data
        updated_instance.refresh_from_db()
        
        return Response(UserSerializer(updated_instance).data)


class AdminUserDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Don't allow deleting yourself
        if instance.id == request.user.id:
            return Response(
                {"detail": "Jūs nevarat dzēst savu profilu"},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
