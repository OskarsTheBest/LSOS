from django.contrib import admin
from django.urls import path
from api.views import (
    RegisterView, ProfileView, ProfileUpdateView, CustomTokenObtainPairView,
    UserListSearchView, AdminUserCreateView, AdminUserUpdateView, AdminUserDeleteView,
    PasswordChangeView
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/register/', RegisterView.as_view()),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/profile/", ProfileView.as_view(), name="profile"),
    path("api/profile/update/", ProfileUpdateView.as_view(), name="profile_update"),
    path("api/profile/change-password/", PasswordChangeView.as_view(), name="change_password"),
    path("api/admin/users/", UserListSearchView.as_view(), name="admin_users_list"),
    path("api/admin/users/create/", AdminUserCreateView.as_view(), name="admin_user_create"),
    path("api/admin/users/<int:pk>/update/", AdminUserUpdateView.as_view(), name="admin_user_update"),
    path("api/admin/users/<int:pk>/delete/", AdminUserDeleteView.as_view(), name="admin_user_delete"),
]
