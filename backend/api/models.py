from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', "admin")

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email=email, password=password, **extra_fields)


class Skola(models.Model):
    """Table 3.2 — Skolas"""
    nosaukums = models.CharField(max_length=50)
    pasvaldiba = models.CharField(max_length=50, blank=True, null=True)
    adrese = models.CharField(max_length=50)

    class Meta:
        db_table = 'Skolas'
        verbose_name = 'Skola'
        verbose_name_plural = 'Skolas'

    def __str__(self):
        return self.nosaukums


class User(AbstractUser):
    """Table 3.1 — Konti"""
    username = None
    email = models.EmailField(unique=True)

    # Map to SQL schema fields (Latvian names)
    vards = models.CharField(max_length=50, blank=True, null=True)  # name
    uzvards = models.CharField(max_length=50, blank=True, null=True)  # last_name
    talrNumurs = models.CharField(max_length=20, blank=True, null=True)  # number
    # parole is handled by AbstractUser.password
    izveidosanasDatums = models.DateField(null=True, blank=True)  # create_date (will sync with create_date)
    tips = models.CharField(max_length=30, default="normal")  # user_type
    skola = models.ForeignKey(Skola, on_delete=models.SET_NULL, null=True, blank=True, related_name='lietotaji')

    # Keep existing fields for backward compatibility (English names)
    name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    number = models.CharField(max_length=30, blank=True)

    USER_TYPES = (
        ("normal", "Normal (R)"),
        ("teacher", "Teacher (S)"),
        ("admin", "Admin (A)"),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default="normal")

    create_date = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'Konti'
        verbose_name = 'Konts'
        verbose_name_plural = 'Konti'

    def save(self, *args, **kwargs):
        # Sync fields for backward compatibility
        if not self.vards and self.name:
            self.vards = self.name
        if not self.name and self.vards:
            self.name = self.vards
            
        if not self.uzvards and self.last_name:
            self.uzvards = self.last_name
        if not self.last_name and self.uzvards:
            self.last_name = self.uzvards
            
        if not self.talrNumurs and self.number:
            self.talrNumurs = self.number
        if not self.number and self.talrNumurs:
            self.number = self.talrNumurs
            
        if not self.tips:
            self.tips = self.user_type
        if not self.user_type:
            self.user_type = self.tips
        
        # Sync izveidosanasDatums with create_date
        if not self.id:  # New instance
            from django.utils import timezone
            self.izveidosanasDatums = timezone.now().date()
        elif not self.izveidosanasDatums and self.create_date:
            self.izveidosanasDatums = self.create_date.date()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class Prieksmets(models.Model):
    """Table 3.6 — Prieksmeti"""
    nosaukums = models.CharField(max_length=50)
    kategorija = models.CharField(max_length=50)

    class Meta:
        db_table = 'Prieksmeti'
        verbose_name = 'Priekšmets'
        verbose_name_plural = 'Priekšmeti'

    def __str__(self):
        return self.nosaukums


class Olimpiade(models.Model):
    """Table 3.5 — Olimpiades"""
    nosaukums = models.CharField(max_length=100)
    datums = models.DateField()
    maxDalibnieki = models.IntegerField(null=True, blank=True)
    apraksts = models.CharField(max_length=250, blank=True, null=True)
    norisesVieta = models.CharField(max_length=100)
    organizetajs = models.CharField(max_length=50)
    pieteikums = models.ForeignKey('Pieteikums', on_delete=models.SET_NULL, null=True, blank=True, related_name='olimpiades_pieteikums')
    prieksmets = models.ForeignKey(Prieksmets, on_delete=models.CASCADE, related_name='olimpiades')

    class Meta:
        db_table = 'Olimpiades'
        verbose_name = 'Olimpiāde'
        verbose_name_plural = 'Olimpiādes'

    def __str__(self):
        return self.nosaukums


class Pieteikums(models.Model):
    """Table 3.3 — Pieteikumi"""
    statuss = models.CharField(max_length=50)
    pieteikumaDatums = models.DateField(auto_now_add=True)
    lietotajs = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pieteikumi')
    olimpiade = models.ForeignKey(Olimpiade, on_delete=models.CASCADE, related_name='pieteikumi')

    class Meta:
        db_table = 'Pieteikumi'
        verbose_name = 'Pieteikums'
        verbose_name_plural = 'Pieteikumi'

    def __str__(self):
        return f"{self.lietotajs.email} - {self.olimpiade.nosaukums}"


class Rezultats(models.Model):
    """Table 3.7 — Rezultati"""
    olimpiade = models.ForeignKey(Olimpiade, on_delete=models.CASCADE, related_name='rezultati')
    punktuSkaits = models.FloatField()
    vieta = models.IntegerField()
    rezultataDatums = models.DateField()
    lietotajs = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rezultati', null=True, blank=True)

    class Meta:
        db_table = 'Rezultati'
        verbose_name = 'Rezultāts'
        verbose_name_plural = 'Rezultāti'

    def __str__(self):
        return f"{self.olimpiade.nosaukums} - {self.vieta}. vieta"


class SkolasStarp(models.Model):
    """Table 3.4 — SkolasStarp (Many-to-Many relationship)"""
    skolas = models.ForeignKey(Skola, on_delete=models.CASCADE, related_name='olimpiades')
    olimpiades = models.ForeignKey(Olimpiade, on_delete=models.CASCADE, related_name='skolas')

    class Meta:
        db_table = 'SkolasStarp'
        verbose_name = 'Skola-Olimpiāde'
        verbose_name_plural = 'Skolas-Olimpiādes'
        unique_together = [['skolas', 'olimpiades']]

    def __str__(self):
        return f"{self.skolas.nosaukums} - {self.olimpiades.nosaukums}"
