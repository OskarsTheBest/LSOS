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
    password = "Admin123"
    
    if User.objects.filter(email=email).exists():
        print(f"Admin user with email {email} already exists!")
        user = User.objects.get(email=email)
        user.set_password(password)
        user.user_type = "admin"
        user.tips = "admin"
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated existing admin user: {email}")
    else:
        user = User.objects.create_user(
            email=email,
            password=password,
            user_type="admin",
            tips="admin",
            is_staff=True,
            is_superuser=True
        )
        print(f"Created admin user: {email}")
    
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"User Type: {user.user_type}")
    print(f"Is Staff: {user.is_staff}")
    print(f"Is Superuser: {user.is_superuser}")
    print()


def create_teacher():
    email = "teacher@gmail.com"
    password = "Teacher123"
    
    if User.objects.filter(email=email).exists():
        print(f"Teacher user with email {email} already exists!")
        user = User.objects.get(email=email)
        user.set_password(password)
        user.user_type = "teacher"
        user.tips = "teacher"
        user.is_staff = False
        user.is_superuser = False
        user.save()
        print(f"Updated existing teacher user: {email}")
    else:
        user = User.objects.create_user(
            email=email,
            password=password,
            user_type="teacher",
            tips="teacher",
            is_staff=False,
            is_superuser=False
        )
        print(f"Created teacher user: {email}")
    
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"User Type: {user.user_type}")
    print(f"Is Staff: {user.is_staff}")
    print(f"Is Superuser: {user.is_superuser}")
    print()


if __name__ == "__main__":
    print("Creating admin and teacher accounts...")
    print("=" * 50)
    create_admin()
    create_teacher()
    print("=" * 50)
    print("Done!")
