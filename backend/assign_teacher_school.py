import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Set UTF-8 encoding for output
if sys.stdout.encoding != 'utf-8':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

from api.models import User, Skola

# Get or create a school
school, created = Skola.objects.get_or_create(
    nosaukums="Rīgas Valsts vācu ģimnāzija",
    defaults={
        'pasvaldiba': 'Rīga',
        'adrese': 'Rīga, Latvija'
    }
)

# Get the teacher
try:
    teacher = User.objects.get(email="teacher@gmail.com")
    teacher.skola = school
    teacher.save()
    print(f"Teacher {teacher.email} assigned to school: {school.nosaukums}")
except User.DoesNotExist:
    print("Teacher with email teacher@gmail.com not found")

