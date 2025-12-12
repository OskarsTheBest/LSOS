#!/usr/bin/env python
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

def create_admin():
    email = "admin@gmail.com"
    password = "123"
    
    if User.objects.filter(email=email).exists():
        print(f"Admin user with email {email} already exists!")
        user = User.objects.get(email=email)
        user.set_password(password)
        user.user_type = "admin"
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated existing admin user: {email}")
    else:
        user = User.objects.create_user(
            email=email,
            password=password,
            user_type="admin",
            is_staff=True,
            is_superuser=True
        )
        print(f"Created admin user: {email}")
    
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"User Type: {user.user_type}")
    print(f"Is Staff: {user.is_staff}")
    print(f"Is Superuser: {user.is_superuser}")

if __name__ == "__main__":
    create_admin()




