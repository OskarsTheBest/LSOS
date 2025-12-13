from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
import json
import requests
from datetime import datetime
from django.utils import timezone
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer, 
    ProfileUpdateSerializer, AdminUserSerializer, PasswordChangeSerializer,
    SkolaSerializer, OlimpiadeSerializer, PrieksmetsSerializer, PieteikumsSerializer,
    RezultatsSerializer
)
from .models import User, Skola, Olimpiade, Prieksmets, Pieteikums, Rezultats

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
        
        # Prevent users from changing their own user_type
        # This applies to all users including admins
        data = request.data.copy()
        if 'user_type' in data:
            data.pop('user_type', None)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        instance.refresh_from_db()
        return Response(UserSerializer(instance).data)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'admin'


class IsTeacherOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type in ['teacher', 'admin']


class UserListSearchView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]  # Teachers can view too
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
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        updated_instance.refresh_from_db()
        
        return Response(UserSerializer(updated_instance).data)


class AdminUserDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {"detail": "Jūs nevarat dzēst savu profilu"},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordChangeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordChangeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({"detail": "Parole veiksmīgi nomainīta"}, status=status.HTTP_200_OK)


class SchoolListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = SkolaSerializer
    
    def get_queryset(self):
        queryset = Skola.objects.all().order_by('nosaukums')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nosaukums__icontains=search) |
                Q(pasvaldiba__icontains=search) |
                Q(adrese__icontains=search)
            )
        return queryset


class SchoolDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = SkolaSerializer
    queryset = Skola.objects.all()


class SchoolCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = SkolaSerializer
    queryset = Skola.objects.all()


class SchoolUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = SkolaSerializer
    queryset = Skola.objects.all()
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class SchoolDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Skola.objects.all()
    serializer_class = SkolaSerializer


class AddUserToSchoolView(generics.GenericAPIView):
    """SCHOOL_001: Pievienot lietotāju skolai - Teachers and Admins"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        school_id = request.data.get('school_id')
        
        if not user_id or not school_id:
            return Response(
                {"detail": "Lietotāja ID un skolas ID ir obligāti"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            school = Skola.objects.get(id=school_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Lietotājs nav atrasts"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Skola.DoesNotExist:
            return Response(
                {"detail": "Skola nav atrasta"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent adding admin users to schools
        if user.user_type == 'admin':
            return Response(
                {"detail": "Administratorus nevar pievienot skolām"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.skola = school
        user.save()
        
        return Response(
            {"detail": f"Lietotājs veiksmīgi pievienots skolai {school.nosaukums}"},
            status=status.HTTP_200_OK
        )


class RemoveUserFromSchoolView(generics.GenericAPIView):
    """SCHOOL_002: Noņemt lietotāju no skolas - Teachers and Admins"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"detail": "Lietotāja ID ir obligāts"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Lietotājs nav atrasts"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent removing admin users (they shouldn't be in schools anyway)
        if user.user_type == 'admin':
            return Response(
                {"detail": "Administratorus nevar noņemt no skolām"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        school_name = user.skola.nosaukums if user.skola else None
        user.skola = None
        user.save()
        
        return Response(
            {"detail": f"Lietotājs veiksmīgi noņemts no skolas" + (f" {school_name}" if school_name else "")},
            status=status.HTTP_200_OK
        )


class SchoolUsersListView(generics.ListAPIView):
    """Get all users for a specific school"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        school_id = self.request.query_params.get('school_id')
        if not school_id:
            return User.objects.none()
        
        try:
            school = Skola.objects.get(id=school_id)
            # Filter out admin users from school users list (they shouldn't be in schools)
            return User.objects.filter(skola=school).exclude(user_type='admin').order_by('name', 'last_name')
        except Skola.DoesNotExist:
            return User.objects.none()


class UsersWithoutSchoolListView(generics.ListAPIView):
    """Get all users without a school"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        search = self.request.query_params.get('search', None)
        # Filter out admin users - they cannot be added to schools
        queryset = User.objects.filter(skola__isnull=True).exclude(user_type='admin').order_by('name', 'last_name')
        
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset


class PrieksmetsListView(generics.ListAPIView):
    """Get all subjects"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrieksmetsSerializer
    queryset = Prieksmets.objects.all().order_by('nosaukums')


class OlympiadListView(generics.ListAPIView):
    """OLYMP_003, OLYMP_004: List and search olympiads - All users (public)"""
    permission_classes = []  # Public access
    serializer_class = OlimpiadeSerializer
    
    def get_queryset(self):
        queryset = Olimpiade.objects.all().order_by('-datums')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nosaukums__icontains=search) |
                Q(norisesVieta__icontains=search) |
                Q(organizetajs__icontains=search) |
                Q(prieksmets__nosaukums__icontains=search)
            )
        return queryset


class OlympiadCreateView(generics.CreateAPIView):
    """OLYMP_001: Create olympiad - Admin only"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = OlimpiadeSerializer
    queryset = Olimpiade.objects.all()


class OlympiadUpdateView(generics.UpdateAPIView):
    """OLYMP_002: Update olympiad - Admin only"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = OlimpiadeSerializer
    queryset = Olimpiade.objects.all()
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class OlympiadDeleteView(generics.DestroyAPIView):
    """OLYMP_002: Delete olympiad - Admin only"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Olimpiade.objects.all()
    serializer_class = OlimpiadeSerializer


class OlympiadDetailView(generics.RetrieveAPIView):
    """Get olympiad details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OlimpiadeSerializer
    queryset = Olimpiade.objects.all()


class SchoolApplicationsListView(generics.ListAPIView):
    """Get all applications for a specific school - Teachers see their school, Admins can choose"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = PieteikumsSerializer
    
    def get_queryset(self):
        school_id = self.request.query_params.get('school_id', None)
        user = self.request.user
        
        # Teachers see their own school's applications
        if user.user_type == 'teacher':
            if not user.skola:
                return Pieteikums.objects.none()
            school_id = user.skola.id
        
        # Admins can specify school_id
        if not school_id:
            return Pieteikums.objects.none()
        
        try:
            school = Skola.objects.get(id=school_id)
            # Get applications from users in this school
            return Pieteikums.objects.filter(
                lietotajs__skola=school
            ).order_by('-pieteikumaDatums')
        except Skola.DoesNotExist:
            return Pieteikums.objects.none()


class UpdateApplicationStatusView(generics.GenericAPIView):
    """FORM_005: Approve application - Teachers and Admins"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def patch(self, request, *args, **kwargs):
        application_id = request.data.get('application_id')
        new_status = request.data.get('status')
        
        if not application_id or not new_status:
            return Response(
                {"detail": "Pieteikuma ID un statuss ir obligāti"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            application = Pieteikums.objects.get(id=application_id)
            
            # Teachers can only approve applications from their school
            if request.user.user_type == 'teacher':
                if not request.user.skola or application.lietotajs.skola != request.user.skola:
                    return Response(
                        {"detail": "Jums nav tiesību apstiprināt šo pieteikumu"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            application.statuss = new_status
            application.save()
            
            return Response(
                {"detail": f"Pieteikuma statuss veiksmīgi nomainīts uz {new_status}"},
                status=status.HTTP_200_OK
            )
        except Pieteikums.DoesNotExist:
            return Response(
                {"detail": "Pieteikums nav atrasts"},
                status=status.HTTP_404_NOT_FOUND
            )


class OlympiadResultsListView(generics.ListAPIView):
    """RES_001: Get results for an olympiad - All users (public)"""
    permission_classes = []  # Public access
    serializer_class = RezultatsSerializer
    
    def get_queryset(self):
        olympiad_id = self.request.query_params.get('olympiad_id', None)
        if not olympiad_id:
            return Rezultats.objects.none()
        
        try:
            olympiad = Olimpiade.objects.get(id=olympiad_id)
            return Rezultats.objects.filter(olimpiade=olympiad).order_by('vieta', '-punktuSkaits')
        except Olimpiade.DoesNotExist:
            return Rezultats.objects.none()


class ImportResultsView(generics.GenericAPIView):
    """RES_004: Import results from external source - Admin only"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def post(self, request, *args, **kwargs):
        
        olympiad_id = request.data.get('olympiad_id')
        import_type = request.data.get('import_type')  # 'url' or 'file'
        url = request.data.get('url')
        results_data = request.data.get('results_data')
        
        if not olympiad_id:
            return Response(
                {"detail": "Olimpiādes ID ir obligāts"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            olympiad = Olimpiade.objects.get(id=olympiad_id)
        except Olimpiade.DoesNotExist:
            return Response(
                {"detail": "Olimpiāde nav atrasta"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Parse JSON data
        json_data = None
        if import_type == 'url':
            if not url:
                return Response(
                    {"detail": "URL ir obligāts"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                json_data = response.json()
            except requests.RequestException as e:
                return Response(
                    {"detail": f"Neizdevās ielādēt datus no URL: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except json.JSONDecodeError:
                return Response(
                    {"detail": "Nederīgs JSON formāts no URL"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif import_type == 'file':
            if not results_data:
                return Response(
                    {"detail": "JSON dati ir obligāti"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                json_data = json.loads(results_data) if isinstance(results_data, str) else results_data
            except json.JSONDecodeError:
                return Response(
                    {"detail": "Nederīgs JSON formāts"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"detail": "Importa veids jābūt 'url' vai 'file'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate JSON structure
        if not isinstance(json_data, dict) or 'results' not in json_data:
            return Response(
                {"detail": "JSON datiem jāsatur 'results' masīvs"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results_list = json_data.get('results', [])
        if not isinstance(results_list, list):
            return Response(
                {"detail": "'results' jābūt masīvam"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import results
        created_count = 0
        errors = []
        
        for idx, result_data in enumerate(results_list):
            try:
                vieta = result_data.get('vieta') or result_data.get('rank') or result_data.get('place')
                punktuSkaits = result_data.get('punktuSkaits') or result_data.get('points') or result_data.get('score')
                lietotajs_email = result_data.get('lietotajs_email') or result_data.get('user_email') or result_data.get('email')
                rezultataDatums_str = result_data.get('rezultataDatums') or result_data.get('result_date') or result_data.get('date')
                
                if not vieta or punktuSkaits is None:
                    errors.append(f"Rezultāts {idx + 1}: trūkst 'vieta' vai 'punktuSkaits'")
                    continue
                
                # Parse date
                if rezultataDatums_str:
                    try:
                        if isinstance(rezultataDatums_str, str):
                            rezultataDatums = datetime.strptime(rezultataDatums_str, '%Y-%m-%d').date()
                        else:
                            rezultataDatums = timezone.now().date()
                    except ValueError:
                        rezultataDatums = timezone.now().date()
                else:
                    rezultataDatums = timezone.now().date()
                
                # Find user if email provided
                lietotajs = None
                if lietotajs_email:
                    try:
                        lietotajs = User.objects.get(email=lietotajs_email)
                    except User.DoesNotExist:
                        pass  # Create result without user
                
                # Create result
                Rezultats.objects.create(
                    olimpiade=olympiad,
                    vieta=int(vieta),
                    punktuSkaits=float(punktuSkaits),
                    rezultataDatums=rezultataDatums,
                    lietotajs=lietotajs
                )
                created_count += 1
            except Exception as e:
                errors.append(f"Rezultāts {idx + 1}: {str(e)}")
        
        response_data = {
            "detail": f"Veiksmīgi importēti {created_count} rezultāti",
            "created_count": created_count,
            "total_count": len(results_list)
        }
        
        if errors:
            response_data["errors"] = errors
        
        return Response(response_data, status=status.HTTP_200_OK)
