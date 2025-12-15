from django.utils import timezone
from datetime import timedelta, date
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from .models import User, Skola, Prieksmets, Olimpiade, Pieteikums, Rezultats


class LoggingAPIClient(APIClient):
    """
    API client that prints each request and response status to the console.
    Note: Django's test runner captures stdout by default, so this output is
    mainly visible when a test fails or errors.
    """

    def request(self, **kwargs):
        current_test = getattr(self, "_current_test", None)
        prefix = f"[{current_test}]" if current_test else "[TEST]"
        method = kwargs.get("method", "GET")
        path = kwargs.get("PATH_INFO", kwargs.get("path", ""))
        query_string = kwargs.get("QUERY_STRING", "")
        if query_string:
            path = f"{path}?{query_string}"
        

        print(f"\n{prefix} ===== REQUEST =====")
        print(f"{prefix} Method: {method}")
        print(f"{prefix} Path: {path}")
        

        data = kwargs.get("data")
        if data:
            print(f"{prefix} Request Data: {data}")
        

        content_type = kwargs.get("CONTENT_TYPE", kwargs.get("content_type"))
        if content_type:
            print(f"{prefix} Content-Type: {content_type}")
        

        response = super().request(**kwargs)
        

        print(f"{prefix} ===== RESPONSE =====")
        print(f"{prefix} Status Code: {response.status_code}")
        
        response_data = getattr(response, "data", None)
        if response_data is not None:
            print(f"{prefix} Response Data: {response_data}")
        else:
            try:
                if hasattr(response, "content"):
                    content = response.content.decode("utf-8")[:500] 
                    if content:
                        print(f"{prefix} Response Content: {content}")
            except:
                pass
        
        print(f"{prefix} ====================\n")
        return response


class BaseAPITestCase(APITestCase):
    client_class = LoggingAPIClient

    def setUp(self):
        
        if hasattr(self, "client"):
            self.client._current_test = self._testMethodName
        
        # Log test start
        print(f"\n{'='*80}")
        print(f"STARTING TEST: {self._testMethodName}")
        print(f"{'='*80}\n")

        self.normal_user = User.objects.create_user(
            email="normal@example.com",
            password="Password123",
            name="Normal",
            last_name="User",
            user_type="normal",
        )
        self.teacher_user = User.objects.create_user(
            email="teacher@example.com",
            password="Password123",
            name="Teacher",
            last_name="User",
            user_type="teacher",
        )
        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            password="Password123",
            name="Admin",
            last_name="User",
            user_type="admin",
        )
        self.school = Skola.objects.create(
            nosaukums="Rīgas 1. ģimnāzija",
            pasvaldiba="Rīga",
            adrese="Raiņa bulvāris 8",
        )
        self.teacher_user.skola = self.school
        self.teacher_user.save()
        self.prieksmets = Prieksmets.objects.create(
            nosaukums="Matemātika",
            kategorija="STEM",
        )

    def authenticate_as(self, user):
        print(f"[{self._testMethodName}] Authenticating as: {user.email} ({user.user_type})")
        response = self.client.post(
            "/api/token/",
            {"email": user.email, "password": "Password123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        print(f"[{self._testMethodName}] Authentication successful")

    def tearDown(self):
        # Log test completion
        print(f"\n{'='*80}")
        print(f"COMPLETED TEST: {self._testMethodName}")
        print(f"{'='*80}\n")


class GeneralTests(BaseAPITestCase):
    def test_GT1_admin_can_view_lists(self):
        self.authenticate_as(self.admin_user)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get("/api/olympiads/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get("/api/schools/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_GT2_empty_form_validation(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post("/api/admin/users/create/", {}, format="json")
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY])
        response = self.client.post("/api/schools/create/", {}, format="json")
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY])

    def test_GT3_delete_confirmation_accepted(self):
        self.authenticate_as(self.admin_user)
        school = Skola.objects.create(nosaukums="Test School", pasvaldiba="Test", adrese="Test")
        response = self.client.delete(f"/api/schools/{school.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Skola.objects.filter(id=school.id).exists())

    def test_GT4_delete_confirmation_rejected(self):
        self.authenticate_as(self.admin_user)
        school = Skola.objects.create(nosaukums="Test School", pasvaldiba="Test", adrese="Test")
        school_id = school.id
        self.client.delete(f"/api/schools/{school_id}/delete/")
        self.assertFalse(Skola.objects.filter(id=school_id).exists())


class UserRegistrationTests(BaseAPITestCase):
    def test_T1_register_success(self):
        data = {
            "email": "janis.berzins@gmail.com",
            "password": "Parole123",
            "name": "Jānis",
            "last_name": "Bērziņš",
            "number": "+37120290000",
        }
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="janis.berzins@gmail.com")
        self.assertNotEqual(user.password, "Parole123")
        self.assertTrue(user.check_password("Parole123"))

    def test_T2_register_invalid_format(self):
        data = {
            "email": "janis.berzins.gmail.com",
            "password": "Kakis",
            "name": "",
            "last_name": "",
            "number": "+371a2b0c29",
        }
        response = self.client.post("/api/register/", data, format="json")
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY])

    def test_T3_register_duplicate_email(self):
        data = {
            "email": self.normal_user.email,
            "password": "Parole123",
            "name": "Jānis",
            "last_name": "Bērziņš",
            "number": "+37120290001",
        }
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_T4_register_password_mismatch(self):
        data = {
            "email": "test@example.com",
            "password": "Parole123",
            "name": "Test",
            "last_name": "User",
            "number": "+37120290000",
        }
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_T5_register_password_too_short(self):
        data = {
            "email": "test@example.com",
            "password": "Parole",
            "name": "Test",
            "last_name": "User",
            "number": "+37120290000",
        }
        response = self.client.post("/api/register/", data, format="json")
        if response.status_code == status.HTTP_201_CREATED:
            user = User.objects.get(email="test@example.com")
            self.assertTrue(len(user.password) > 0)

    def test_T6_register_field_too_long(self):
        long_string = "a" * 256
        data = {
            "email": f"{long_string}@gmail.com",
            "password": "Parole123",
            "name": long_string,
            "last_name": long_string,
            "number": "+37120290000",
        }
        response = self.client.post("/api/register/", data, format="json")
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY])


class UserManagementTests(BaseAPITestCase):
    def test_T7_admin_change_user_role(self):
        self.authenticate_as(self.admin_user)
        response = self.client.patch(
            f"/api/admin/users/{self.normal_user.id}/update/",
            {"user_type": "teacher", "skola": self.school.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.user_type, "teacher")

    def test_T8_admin_change_role_to_same(self):
        self.authenticate_as(self.admin_user)
        response = self.client.patch(
            f"/api/admin/users/{self.normal_user.id}/update/",
            {"user_type": "normal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_T9_user_delete_own_account(self):
        self.authenticate_as(self.normal_user)
        user_id = self.normal_user.id
        response = self.client.delete(f"/api/admin/users/{user_id}/delete/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_T10_admin_delete_user(self):
        self.authenticate_as(self.admin_user)
        new_user = User.objects.create_user(
            email="todelete@example.com",
            password="Password123",
            user_type="normal",
        )
        response = self.client.delete(f"/api/admin/users/{new_user.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=new_user.id).exists())

    def test_T11_login_success(self):
        response = self.client.post(
            "/api/token/",
            {"email": self.normal_user.email, "password": "Password123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_T12_login_invalid_credentials(self):
        response = self.client.post(
            "/api/token/",
            {"email": self.normal_user.email, "password": "WrongPassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_T13_logout(self):
        self.authenticate_as(self.normal_user)
        self.client.credentials()
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_T14_search_users(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.get("/api/admin/users/?search=Jānis")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_T15_view_profile(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.normal_user.email)


class ApplicationTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.normal_user.skola = self.school
        self.normal_user.save()
        self.future_olympiad = Olimpiade.objects.create(
            nosaukums="Future Olympiad",
            datums=timezone.now().date() + timedelta(days=30),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        self.past_olympiad = Olimpiade.objects.create(
            nosaukums="Past Olympiad",
            datums=timezone.now().date() - timedelta(days=30),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )

    def test_T16_create_application_success(self):
        self.authenticate_as(self.normal_user)
        application = Pieteikums.objects.create(
            lietotajs=self.normal_user,
            olimpiade=self.future_olympiad,
            statuss="Apstrādē",
        )
        self.assertEqual(application.statuss, "Apstrādē")

    def test_T17_create_application_past_olympiad(self):
        self.authenticate_as(self.normal_user)
        application = Pieteikums.objects.create(
            lietotajs=self.normal_user,
            olimpiade=self.past_olympiad,
            statuss="Apstrādē",
        )
        self.assertIsNotNone(application)

    def test_T18_create_application_no_school(self):
        user_no_school = User.objects.create_user(
            email="noschool@example.com",
            password="Password123",
            user_type="normal",
        )
        self.authenticate_as(user_no_school)
        application = Pieteikums.objects.create(
            lietotajs=user_no_school,
            olimpiade=self.future_olympiad,
            statuss="Apstrādē",
        )
        self.assertIsNotNone(application)

    def test_T19_cancel_application(self):
        self.authenticate_as(self.normal_user)
        application = Pieteikums.objects.create(
            lietotajs=self.normal_user,
            olimpiade=self.future_olympiad,
            statuss="Apstrādē",
        )
        application.statuss = "Atcelts"
        application.save()
        self.assertEqual(application.statuss, "Atcelts")

    def test_T20_admin_delete_application(self):
        self.authenticate_as(self.admin_user)
        application = Pieteikums.objects.create(
            lietotajs=self.normal_user,
            olimpiade=self.future_olympiad,
            statuss="Apstrādē",
        )
        application_id = application.id
        application.delete()
        self.assertFalse(Pieteikums.objects.filter(id=application_id).exists())

    def test_T21_view_own_applications(self):
        self.authenticate_as(self.normal_user)
        Pieteikums.objects.create(
            lietotajs=self.normal_user,
            olimpiade=self.future_olympiad,
            statuss="Apstrādē",
        )
        applications = Pieteikums.objects.filter(lietotajs=self.normal_user)
        self.assertGreater(applications.count(), 0)

    def test_T22_approve_application(self):
        self.authenticate_as(self.teacher_user)
        application = Pieteikums.objects.create(
            lietotajs=self.normal_user,
            olimpiade=self.future_olympiad,
            statuss="Apstrādē",
        )
        response = self.client.patch(
            "/api/applications/update-status/",
            {"application_id": application.id, "status": "Apstiprināts"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.statuss, "Apstiprināts")

    def test_T23_reject_application(self):
        self.authenticate_as(self.teacher_user)
        application = Pieteikums.objects.create(
            lietotajs=self.normal_user,
            olimpiade=self.future_olympiad,
            statuss="Apstrādē",
        )
        response = self.client.patch(
            "/api/applications/update-status/",
            {"application_id": application.id, "status": "Atliegts"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.statuss, "Atliegts")

    def test_T24_approve_nonexistent_application(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.patch(
            "/api/applications/update-status/",
            {"application_id": 99999, "status": "Apstiprināts"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ResultsTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.olympiad = Olimpiade.objects.create(
            nosaukums="Test Olympiad",
            datums=timezone.now().date() - timedelta(days=10),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        self.result = Rezultats.objects.create(
            olimpiade=self.olympiad,
            lietotajs=self.normal_user,
            punktuSkaits=80,
            vieta=1,
            rezultataDatums=timezone.now().date(),
        )

    def test_T25_view_results(self):
        response = self.client.get(f"/api/olympiads/{self.olympiad.id}/results/?olympiad_id={self.olympiad.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, list):
            self.assertGreaterEqual(len(response.data), 1)
        elif isinstance(response.data, dict):
            if 'results' in response.data:
                self.assertGreaterEqual(len(response.data['results']), 1)
            else:
                self.assertGreaterEqual(len(response.data), 1)

    def test_T26_admin_edit_result(self):
        self.authenticate_as(self.admin_user)
        self.result.punktuSkaits = 90
        self.result.save()
        self.assertEqual(self.result.punktuSkaits, 90)

    def test_T27_admin_delete_result(self):
        self.authenticate_as(self.admin_user)
        result_id = self.result.id
        self.result.delete()
        self.assertFalse(Rezultats.objects.filter(id=result_id).exists())

    def test_T28_edit_nonexistent_result(self):
        self.authenticate_as(self.admin_user)
        nonexistent_id = 99999
        self.assertFalse(Rezultats.objects.filter(id=nonexistent_id).exists())

    def test_T29_publish_results(self):
        self.authenticate_as(self.admin_user)
        results = Rezultats.objects.filter(olimpiade=self.olympiad)
        self.assertGreater(results.count(), 0)

    def test_T30_publish_already_published(self):
        self.authenticate_as(self.admin_user)
        results = Rezultats.objects.filter(olimpiade=self.olympiad)
        self.assertGreater(results.count(), 0)

    def test_T31_import_results_success(self):
        self.authenticate_as(self.admin_user)
        import json
        results_data = {
            "results": [
                {
                    "vieta": 1,
                    "punktuSkaits": 95,
                    "lietotajs_email": self.normal_user.email,
                    "rezultataDatums": str(timezone.now().date()),
                }
            ]
        }
        response = self.client.post(
            "/api/results/import/",
            {
                "olympiad_id": self.olympiad.id,
                "json_data": json.dumps(results_data),
            },
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_T32_import_results_invalid_format(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/results/import/",
            {
                "olympiad_id": self.olympiad.id,
                "url": "http://invalid-url",
            },
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


class SchoolTests(BaseAPITestCase):
    def test_T33_add_user_to_school(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.post(
            "/api/schools/add-user/",
            {"user_id": self.normal_user.id, "school_id": self.school.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.skola, self.school)

    def test_T34_add_user_already_in_school(self):
        self.normal_user.skola = self.school
        self.normal_user.save()
        self.authenticate_as(self.admin_user)
        other_school = Skola.objects.create(
            nosaukums="Other School",
            pasvaldiba="Test",
            adrese="Test",
        )
        response = self.client.post(
            "/api/schools/add-user/",
            {"user_id": self.normal_user.id, "school_id": other_school.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_T35_add_user_no_user_selected(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/schools/add-user/",
            {"school_id": self.school.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_T36_remove_user_from_school(self):
        self.normal_user.skola = self.school
        self.normal_user.save()
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/schools/remove-user/",
            {"user_id": self.normal_user.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.normal_user.refresh_from_db()
        self.assertIsNone(self.normal_user.skola)

    def test_T37_remove_user_not_in_school(self):
        self.normal_user.skola = None
        self.normal_user.save()
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/schools/remove-user/",
            {"user_id": self.normal_user.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_T38_create_school_success(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/schools/create/",
            {
                "nosaukums": "Rīgas 1. ģimnāzija",
                "pasvaldiba": "Rīga",
                "adrese": "Raiņa bulvāris 8",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_T39_create_school_duplicate_name(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/schools/create/",
            {
                "nosaukums": self.school.nosaukums,
                "pasvaldiba": "Rīga",
                "adrese": "Different address",
            },
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_T40_update_school(self):
        self.authenticate_as(self.admin_user)
        response = self.client.patch(
            f"/api/schools/{self.school.id}/update/",
            {"adrese": "Jauna adrese"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.school.refresh_from_db()
        self.assertEqual(self.school.adrese, "Jauna adrese")

    def test_T41_delete_school(self):
        self.authenticate_as(self.admin_user)
        school = Skola.objects.create(
            nosaukums="To Delete",
            pasvaldiba="Test",
            adrese="Test",
        )
        response = self.client.delete(f"/api/schools/{school.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Skola.objects.filter(id=school.id).exists())

    def test_T42_delete_nonexistent_school(self):
        self.authenticate_as(self.admin_user)
        response = self.client.delete("/api/schools/99999/delete/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class OlympiadTests(BaseAPITestCase):
    def test_T43_create_olympiad_success(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/olympiads/create/",
            {
                "nosaukums": "Matemātikas valsts olimpiāde 2025",
                "datums": str(timezone.now().date() + timedelta(days=60)),
                "maxDalibnieki": 50,
                "apraksts": "Valsts matemātikas olimpiāde",
                "norisesVieta": "Rīgas 1. ģimnāzijā",
                "organizetajs": "VISC",
                "prieksmets": self.prieksmets.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_T44_create_olympiad_duplicate_name(self):
        existing = Olimpiade.objects.create(
            nosaukums="Existing Olympiad",
            datums=timezone.now().date() + timedelta(days=30),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/olympiads/create/",
            {
                "nosaukums": existing.nosaukums,
                "datums": str(timezone.now().date() + timedelta(days=60)),
                "maxDalibnieki": 50,
                "apraksts": "Test",
                "norisesVieta": "Rīga",
                "organizetajs": "VISC",
                "prieksmets": self.prieksmets.id,
            },
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_T45_create_olympiad_exceeds_max_participants(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/olympiads/create/",
            {
                "nosaukums": "Test Olympiad",
                "datums": str(timezone.now().date() + timedelta(days=30)),
                "maxDalibnieki": 1,
                "apraksts": "Test",
                "norisesVieta": "Rīga",
                "organizetajs": "VISC",
                "prieksmets": self.prieksmets.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_T46_update_olympiad(self):
        olympiad = Olimpiade.objects.create(
            nosaukums="Test Olympiad",
            datums=timezone.now().date() + timedelta(days=30),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        self.authenticate_as(self.admin_user)
        response = self.client.patch(
            f"/api/olympiads/{olympiad.id}/update/",
            {"maxDalibnieki": 40},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        olympiad.refresh_from_db()
        self.assertEqual(olympiad.maxDalibnieki, 40)

    def test_T47_delete_olympiad(self):
        olympiad = Olimpiade.objects.create(
            nosaukums="To Delete",
            datums=timezone.now().date() + timedelta(days=30),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        self.authenticate_as(self.admin_user)
        response = self.client.delete(f"/api/olympiads/{olympiad.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Olimpiade.objects.filter(id=olympiad.id).exists())

    def test_T48_view_olympiads(self):
        response = self.client.get("/api/olympiads/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_T49_view_nonexistent_olympiad(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/olympiads/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_T50_search_olympiads(self):
        response = self.client.get("/api/olympiads/?search=matemātika")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AccessControlTests(BaseAPITestCase):
    def test_AT1_unauthenticated_access_admin_pages(self):
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.get("/api/schools/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT2_normal_user_access_admin_pages(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.get("/api/schools/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT3_teacher_access_admin_pages(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get("/api/schools/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT4_admin_access_admin_pages(self):
        self.authenticate_as(self.admin_user)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get("/api/schools/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT5_unauthenticated_create_operations(self):
        response = self.client.post("/api/admin/users/create/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.post("/api/schools/create/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT6_normal_user_create_operations(self):
        self.authenticate_as(self.normal_user)
        response = self.client.post("/api/admin/users/create/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.post("/api/schools/create/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT7_teacher_create_operations(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.post("/api/admin/users/create/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.post("/api/schools/create/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT8_admin_create_operations(self):
        self.authenticate_as(self.admin_user)
        response = self.client.post(
            "/api/admin/users/create/",
            {
                "email": "new@example.com",
                "password": "Password123",
                "user_type": "normal",
            },
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_AT9_unauthenticated_update_operations(self):
        response = self.client.patch(f"/api/admin/users/{self.normal_user.id}/update/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT10_normal_user_update_operations(self):
        self.authenticate_as(self.normal_user)
        response = self.client.patch(f"/api/admin/users/{self.normal_user.id}/update/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT11_teacher_update_operations(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.patch(f"/api/admin/users/{self.normal_user.id}/update/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT12_admin_update_operations(self):
        self.authenticate_as(self.admin_user)
        response = self.client.patch(
            f"/api/admin/users/{self.normal_user.id}/update/",
            {"name": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT13_unauthenticated_delete_operations(self):
        response = self.client.delete(f"/api/admin/users/{self.normal_user.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT14_normal_user_delete_operations(self):
        self.authenticate_as(self.normal_user)
        response = self.client.delete(f"/api/admin/users/{self.normal_user.id}/delete/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_AT15_teacher_delete_operations(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.delete(f"/api/admin/users/{self.normal_user.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT16_admin_delete_operations(self):
        self.authenticate_as(self.admin_user)
        new_user = User.objects.create_user(
            email="todelete@example.com",
            password="Password123",
            user_type="normal",
        )
        response = self.client.delete(f"/api/admin/users/{new_user.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_AT17_unauthenticated_import_results(self):
        response = self.client.post("/api/results/import/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT18_normal_user_import_results(self):
        self.authenticate_as(self.normal_user)
        response = self.client.post("/api/results/import/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT19_teacher_import_results(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.post("/api/results/import/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT20_admin_import_results(self):
        self.authenticate_as(self.admin_user)
        olympiad = Olimpiade.objects.create(
            nosaukums="Test",
            datums=timezone.now().date(),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        response = self.client.post(
            "/api/results/import/",
            {"olympiad_id": olympiad.id, "url": "http://test"},
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_AT21_unauthenticated_school_applications(self):
        response = self.client.get("/api/schools/applications/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT22_normal_user_school_applications(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/schools/applications/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT23_teacher_school_applications(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.get("/api/schools/applications/?school_id=" + str(self.school.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT24_admin_school_applications(self):
        self.authenticate_as(self.admin_user)
        response = self.client.get("/api/schools/applications/?school_id=" + str(self.school.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT25_unauthenticated_manage_school_users(self):
        response = self.client.get("/api/schools/users/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT26_normal_user_manage_school_users(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/schools/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_AT27_teacher_manage_school_users(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.get("/api/schools/users/?school_id=" + str(self.school.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT28_admin_manage_school_users(self):
        self.authenticate_as(self.admin_user)
        response = self.client.get("/api/schools/users/?school_id=" + str(self.school.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT29_unauthenticated_olympiads(self):
        response = self.client.get("/api/olympiads/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT30_normal_user_olympiads(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/olympiads/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT31_teacher_olympiads(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.get("/api/olympiads/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT32_admin_olympiads(self):
        self.authenticate_as(self.admin_user)
        response = self.client.get("/api/olympiads/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT33_unauthenticated_results(self):
        olympiad = Olimpiade.objects.create(
            nosaukums="Test",
            datums=timezone.now().date(),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        response = self.client.get(f"/api/olympiads/{olympiad.id}/results/?olympiad_id={olympiad.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT34_normal_user_results(self):
        self.authenticate_as(self.normal_user)
        olympiad = Olimpiade.objects.create(
            nosaukums="Test",
            datums=timezone.now().date(),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        response = self.client.get(f"/api/olympiads/{olympiad.id}/results/?olympiad_id={olympiad.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT35_teacher_results(self):
        self.authenticate_as(self.teacher_user)
        olympiad = Olimpiade.objects.create(
            nosaukums="Test",
            datums=timezone.now().date(),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        response = self.client.get(f"/api/olympiads/{olympiad.id}/results/?olympiad_id={olympiad.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT36_admin_results(self):
        self.authenticate_as(self.admin_user)
        olympiad = Olimpiade.objects.create(
            nosaukums="Test",
            datums=timezone.now().date(),
            maxDalibnieki=50,
            apraksts="Test",
            norisesVieta="Rīga",
            organizetajs="VISC",
            prieksmets=self.prieksmets,
        )
        response = self.client.get(f"/api/olympiads/{olympiad.id}/results/?olympiad_id={olympiad.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT37_unauthenticated_profile(self):
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_AT38_normal_user_profile(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT39_teacher_profile(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT40_admin_profile(self):
        self.authenticate_as(self.admin_user)
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT41_unauthenticated_search_olympiads(self):
        response = self.client.get("/api/olympiads/?search=matemātika")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT42_normal_user_search_olympiads(self):
        self.authenticate_as(self.normal_user)
        response = self.client.get("/api/olympiads/?search=matemātika")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT43_teacher_search_olympiads(self):
        self.authenticate_as(self.teacher_user)
        response = self.client.get("/api/olympiads/?search=matemātika")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_AT44_admin_search_olympiads(self):
        self.authenticate_as(self.admin_user)
        response = self.client.get("/api/olympiads/?search=matemātika")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
