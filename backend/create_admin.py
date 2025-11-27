#!/usr/bin/env python
"""
Script to create an admin user with email admin@gmail.com and password 123
Run this from the backend directory: python create_admin.py
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

def create_admin():
    email = "admin@gmail.com"
    password = "123"
    
    # Check if admin already exists
    if User.objects.filter(email=email).exists():
        print(f"Admin user with email {email} already exists!")
        user = User.objects.get(email=email)
        # Update password and ensure admin status
        user.set_password(password)
        user.user_type = "admin"
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated existing admin user: {email}")
    else:
        # Create new admin user
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




