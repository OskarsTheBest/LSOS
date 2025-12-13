from django.contrib import admin
from django.urls import path
from api.views import (
    RegisterView, ProfileView, ProfileUpdateView, CustomTokenObtainPairView,
    UserListSearchView, AdminUserCreateView, AdminUserUpdateView, AdminUserDeleteView,
    PasswordChangeView, SchoolListView, SchoolDetailView, SchoolCreateView, SchoolUpdateView, SchoolDeleteView,
    AddUserToSchoolView, RemoveUserFromSchoolView, SchoolUsersListView, UsersWithoutSchoolListView,
    PrieksmetsListView, OlympiadListView, OlympiadDetailView, OlympiadCreateView, OlympiadUpdateView, OlympiadDeleteView,
    SchoolApplicationsListView, UpdateApplicationStatusView, OlympiadResultsListView, ImportResultsView
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
    path("api/schools/", SchoolListView.as_view(), name="schools_list"),
    path("api/schools/<int:pk>/", SchoolDetailView.as_view(), name="school_detail"),
    path("api/schools/create/", SchoolCreateView.as_view(), name="school_create"),
    path("api/schools/<int:pk>/update/", SchoolUpdateView.as_view(), name="school_update"),
    path("api/schools/<int:pk>/delete/", SchoolDeleteView.as_view(), name="school_delete"),
    path("api/schools/users/", SchoolUsersListView.as_view(), name="school_users_list"),
    path("api/schools/users/without-school/", UsersWithoutSchoolListView.as_view(), name="users_without_school"),
    path("api/schools/add-user/", AddUserToSchoolView.as_view(), name="add_user_to_school"),
    path("api/schools/remove-user/", RemoveUserFromSchoolView.as_view(), name="remove_user_from_school"),
    path("api/prieksmeti/", PrieksmetsListView.as_view(), name="prieksmeti_list"),
    path("api/olympiads/", OlympiadListView.as_view(), name="olympiads_list"),
    path("api/olympiads/<int:pk>/", OlympiadDetailView.as_view(), name="olympiad_detail"),
    path("api/olympiads/create/", OlympiadCreateView.as_view(), name="olympiad_create"),
    path("api/olympiads/<int:pk>/update/", OlympiadUpdateView.as_view(), name="olympiad_update"),
    path("api/olympiads/<int:pk>/delete/", OlympiadDeleteView.as_view(), name="olympiad_delete"),
    path("api/olympiads/<int:pk>/results/", OlympiadResultsListView.as_view(), name="olympiad_results_list"),
    path("api/results/import/", ImportResultsView.as_view(), name="import_results"),
    path("api/schools/applications/", SchoolApplicationsListView.as_view(), name="school_applications_list"),
    path("api/applications/update-status/", UpdateApplicationStatusView.as_view(), name="update_application_status"),
]
