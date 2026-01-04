#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User, Skola, Olimpiade, Prieksmets, Pieteikums, Rezultats
from django.utils import timezone

def create_sample_data():
    print("Creating sample data...")
    print("=" * 50)
    
    print("\n1. Creating Prieksmeti...")
    prieksmeti_data = [
        {"nosaukums": "Matemātika", "kategorija": "Eksaktās zinātnes"},
        {"nosaukums": "Fizika", "kategorija": "Eksaktās zinātnes"},
        {"nosaukums": "Ķīmija", "kategorija": "Eksaktās zinātnes"},
        {"nosaukums": "Bioloģija", "kategorija": "Dabaszinātnes"},
        {"nosaukums": "Vēsture", "kategorija": "Humanitārās zinātnes"},
        {"nosaukums": "Latviešu valoda", "kategorija": "Humanitārās zinātnes"},
        {"nosaukums": "Angļu valoda", "kategorija": "Svešvalodas"},
        {"nosaukums": "Vācu valoda", "kategorija": "Svešvalodas"},
        {"nosaukums": "Franču valoda", "kategorija": "Svešvalodas"},
        {"nosaukums": "Krievu valoda", "kategorija": "Svešvalodas"},
        {"nosaukums": "Literatūra", "kategorija": "Humanitārās zinātnes"},
        {"nosaukums": "Ģeogrāfija", "kategorija": "Dabaszinātnes"},
        {"nosaukums": "Informātika", "kategorija": "Eksaktās zinātnes"},
        {"nosaukums": "Ekonomika", "kategorija": "Sociālās zinātnes"},
    ]
    
    prieksmeti = {}
    for p_data in prieksmeti_data:
        prieksmets, created = Prieksmets.objects.get_or_create(
            nosaukums=p_data["nosaukums"],
            defaults={"kategorija": p_data["kategorija"]}
        )
        prieksmeti[p_data["nosaukums"]] = prieksmets
        if created:
            print(f"  ✓ Created: {p_data['nosaukums']}")
        else:
            print(f"  - Already exists: {p_data['nosaukums']}")
    
    print("\n2. Creating Schools...")
    schools_data = [
        {"nosaukums": "Rīgas Valsts vācu ģimnāzija", "pasvaldiba": "Rīga", "adrese": "Rīga, Lāčplēša iela 25"},
        {"nosaukums": "Rīgas 1. ģimnāzija", "pasvaldiba": "Rīga", "adrese": "Rīga, Raiņa bulvāris 8"},
        {"nosaukums": "Rīgas 2. ģimnāzija", "pasvaldiba": "Rīga", "adrese": "Rīga, Krišjāņa Barona iela 1"},
        {"nosaukums": "Rīgas Centra humanitārā vidusskola", "pasvaldiba": "Rīga", "adrese": "Rīga, Brīvības iela 46"},
        {"nosaukums": "Daugavpils Valsts ģimnāzija", "pasvaldiba": "Daugavpils", "adrese": "Daugavpils, Vienības iela 13"},
        {"nosaukums": "Liepājas Valsts 1. ģimnāzija", "pasvaldiba": "Liepāja", "adrese": "Liepāja, Lielā iela 14"},
        {"nosaukums": "Jelgavas ģimnāzija", "pasvaldiba": "Jelgava", "adrese": "Jelgava, Lielā iela 2"},
        {"nosaukums": "Ventspils 1. ģimnāzija", "pasvaldiba": "Ventspils", "adrese": "Ventspils, Skolas iela 5"},
        {"nosaukums": "Rēzeknes ģimnāzija", "pasvaldiba": "Rēzekne", "adrese": "Rēzekne, Atbrīvošanas aleja 90"},
        {"nosaukums": "Valmieras ģimnāzija", "pasvaldiba": "Valmiera", "adrese": "Valmiera, Rīgas iela 2"},
    ]
    
    schools = {}
    for s_data in schools_data:
        school, created = Skola.objects.get_or_create(
            nosaukums=s_data["nosaukums"],
            defaults={
                "pasvaldiba": s_data["pasvaldiba"],
                "adrese": s_data["adrese"]
            }
        )
        schools[s_data["nosaukums"]] = school
        if created:
            print(f"  ✓ Created: {s_data['nosaukums']}")
        else:
            print(f"  - Already exists: {s_data['nosaukums']}")
    
    print("\n3. Creating Users...")
    users_data = [
        {"email": "janis.berzins@gmail.com", "name": "Jānis", "last_name": "Bērziņš", "user_type": "normal", "school": "Rīgas 1. ģimnāzija"},
        {"email": "liene.lapa@gmail.com", "name": "Liene", "last_name": "Lapa", "user_type": "normal", "school": "Rīgas 2. ģimnāzija"},
        {"email": "peteris.kalnins@gmail.com", "name": "Pēteris", "last_name": "Kalniņš", "user_type": "normal", "school": "Rīgas Centra humanitārā vidusskola"},
        {"email": "anna.silina@gmail.com", "name": "Anna", "last_name": "Siliņa", "user_type": "normal", "school": "Daugavpils Valsts ģimnāzija"},
        {"email": "martins.ozols@gmail.com", "name": "Mārtiņš", "last_name": "Ozols", "user_type": "normal", "school": "Liepājas Valsts 1. ģimnāzija"},
        {"email": "elina.berzina@gmail.com", "name": "Elīna", "last_name": "Bērziņa", "user_type": "normal", "school": "Jelgavas ģimnāzija"},
        {"email": "karlis.liepins@gmail.com", "name": "Kārlis", "last_name": "Liepiņš", "user_type": "normal", "school": "Ventspils 1. ģimnāzija"},
        {"email": "linda.krumina@gmail.com", "name": "Linda", "last_name": "Krūmiņa", "user_type": "normal", "school": "Rēzeknes ģimnāzija"},
        {"email": "roberts.petersons@gmail.com", "name": "Roberts", "last_name": "Pētersons", "user_type": "normal", "school": "Valmieras ģimnāzija"},
        {"email": "sandra.miezite@gmail.com", "name": "Sandra", "last_name": "Miezīte", "user_type": "normal", "school": "Rīgas Valsts vācu ģimnāzija"},
        {"email": "oskars.kipens@gmail.com", "name": "Oskars", "last_name": "Ķipēns", "user_type": "normal", "school": "Rīgas 1. ģimnāzija"},
        {"email": "madara.rozite@gmail.com", "name": "Madara", "last_name": "Rozīte", "user_type": "normal", "school": "Rīgas 2. ģimnāzija"},
        {"email": "skolotajs1@gmail.com", "name": "Andris", "last_name": "Zariņš", "user_type": "teacher", "school": "Rīgas 1. ģimnāzija"},
        {"email": "skolotajs2@gmail.com", "name": "Inga", "last_name": "Meiere", "user_type": "teacher", "school": "Rīgas 2. ģimnāzija"},
        {"email": "skolotajs3@gmail.com", "name": "Juris", "last_name": "Vītols", "user_type": "teacher", "school": "Daugavpils Valsts ģimnāzija"},
        {"email": "skolotajs4@gmail.com", "name": "Dace", "last_name": "Bērziņa", "user_type": "teacher", "school": "Liepājas Valsts 1. ģimnāzija"},
    ]
    
    users = {}
    for u_data in users_data:
        if User.objects.filter(email=u_data["email"]).exists():
            user = User.objects.get(email=u_data["email"])
            print(f"  - Already exists: {u_data['email']}")
        else:
            user = User.objects.create_user(
                email=u_data["email"],
                password="Password123",
                name=u_data["name"],
                last_name=u_data["last_name"],
                user_type=u_data["user_type"],
                number=f"+371{random.randint(20000000, 29999999)}"
            )
            if u_data.get("school"):
                user.skola = schools.get(u_data["school"])
                user.save()
            print(f"  ✓ Created: {u_data['email']} ({u_data['user_type']})")
        users[u_data["email"]] = user
    
    print("\n4. Creating Olympiads...")
    today = timezone.now().date()
    olympiads_data = [

        {
            "nosaukums": "Matemātikas valsts olimpiāde 2024",
            "datums": today - timedelta(days=180),
            "maxDalibnieki": 50,
            "apraksts": "Latvijas valsts matemātikas olimpiāde, kurā piedalās skolēni no visas valsts. Olimpiāde ietver gan teorētiskos, gan praktiskos uzdevumus.",
            "norisesVieta": "Rīgas 1. ģimnāzijā",
            "organizetajs": "VISC",
            "prieksmets": "Matemātika"
        },
        {
            "nosaukums": "Fizikas valsts olimpiāde 2024",
            "datums": today - timedelta(days=150),
            "maxDalibnieki": 40,
            "apraksts": "Valsts fizikas olimpiāde, kurā skolēni demonstrē savas zināšanas fizikas jomā.",
            "norisesVieta": "Rīgas Tehniskajā universitātē",
            "organizetajs": "RTU",
            "prieksmets": "Fizika"
        },
        {
            "nosaukums": "Ķīmijas valsts olimpiāde 2024",
            "datums": today - timedelta(days=120),
            "maxDalibnieki": 35,
            "apraksts": "Valsts ķīmijas olimpiāde ar praktiskajiem eksperimentiem un teorētiskajiem uzdevumiem.",
            "norisesVieta": "Latvijas Universitātē",
            "organizetajs": "LU",
            "prieksmets": "Ķīmija"
        },
        {
            "nosaukums": "Bioloģijas olimpiāde 2024",
            "datums": today - timedelta(days=90),
            "maxDalibnieki": 45,
            "apraksts": "Valsts bioloģijas olimpiāde, kurā skolēni pārbauda savas zināšanas bioloģijā.",
            "norisesVieta": "Daugavpils Universitātē",
            "organizetajs": "DU",
            "prieksmets": "Bioloģija"
        },
        {
            "nosaukums": "Vēstures olimpiāde 2024",
            "datums": today - timedelta(days=60),
            "maxDalibnieki": 30,
            "apraksts": "Valsts vēstures olimpiāde, kurā skolēni demonstrē zināšanas par Latvijas un pasaules vēsturi.",
            "norisesVieta": "Rīgas 1. ģimnāzijā",
            "organizetajs": "VISC",
            "prieksmets": "Vēsture"
        },
        {
            "nosaukums": "Latviešu valodas olimpiāde 2024",
            "datums": today - timedelta(days=45),
            "maxDalibnieki": 35,
            "apraksts": "Valsts latviešu valodas olimpiāde, kurā skolēni pārbauda savas valodas prasmes.",
            "norisesVieta": "Rīgas Centra humanitārā vidusskolā",
            "organizetajs": "VISC",
            "prieksmets": "Latviešu valoda"
        },
        {
            "nosaukums": "Angļu valodas olimpiāde 2024",
            "datums": today - timedelta(days=30),
            "maxDalibnieki": 60,
            "apraksts": "Valsts angļu valodas olimpiāde, kurā skolēni pārbauda savas valodas prasmes.",
            "norisesVieta": "Rīgas 2. ģimnāzijā",
            "organizetajs": "VISC",
            "prieksmets": "Angļu valoda"
        },
        {
            "nosaukums": "Informātikas olimpiāde 2024",
            "datums": today - timedelta(days=15),
            "maxDalibnieki": 50,
            "apraksts": "Valsts informātikas olimpiāde ar programmēšanas uzdevumiem.",
            "norisesVieta": "Rīgas Tehniskajā universitātē",
            "organizetajs": "RTU",
            "prieksmets": "Informātika"
        },

        {
            "nosaukums": "Matemātikas valsts olimpiāde 2025",
            "datums": today + timedelta(days=30),
            "maxDalibnieki": 50,
            "apraksts": "Latvijas valsts matemātikas olimpiāde, kurā piedalās skolēni no visas valsts. Olimpiāde ietver gan teorētiskos, gan praktiskos uzdevumus.",
            "norisesVieta": "Rīgas 1. ģimnāzijā",
            "organizetajs": "VISC",
            "prieksmets": "Matemātika"
        },
        {
            "nosaukums": "Vācu valodas olimpiāde 2025",
            "datums": today + timedelta(days=20),
            "maxDalibnieki": 40,
            "apraksts": "Valsts vācu valodas olimpiāde, kurā skolēni demonstrē savas vācu valodas zināšanas.",
            "norisesVieta": "Rīgas Valsts vācu ģimnāzijā",
            "organizetajs": "VISC",
            "prieksmets": "Vācu valoda"
        },
        {
            "nosaukums": "Ģeogrāfijas olimpiāde 2025",
            "datums": today + timedelta(days=15),
            "maxDalibnieki": 30,
            "apraksts": "Valsts ģeogrāfijas olimpiāde, kurā skolēni demonstrē zināšanas par pasauli.",
            "norisesVieta": "Latvijas Universitātē",
            "organizetajs": "LU",
            "prieksmets": "Ģeogrāfija"
        },
    ]
    
    olympiads = {}
    for o_data in olympiads_data:
        olympiad, created = Olimpiade.objects.get_or_create(
            nosaukums=o_data["nosaukums"],
            defaults={
                "datums": o_data["datums"],
                "maxDalibnieki": o_data["maxDalibnieki"],
                "apraksts": o_data["apraksts"],
                "norisesVieta": o_data["norisesVieta"],
                "organizetajs": o_data["organizetajs"],
                "prieksmets": prieksmeti[o_data["prieksmets"]]
            }
        )

        if not created:
            olympiad.datums = o_data["datums"]
            olympiad.maxDalibnieki = o_data["maxDalibnieki"]
            olympiad.apraksts = o_data["apraksts"]
            olympiad.norisesVieta = o_data["norisesVieta"]
            olympiad.organizetajs = o_data["organizetajs"]
            olympiad.prieksmets = prieksmeti[o_data["prieksmets"]]
            olympiad.save()
        olympiads[o_data["nosaukums"]] = olympiad
        if created:
            print(f"  ✓ Created: {o_data['nosaukums']}")
        else:
            print(f"  - Updated: {o_data['nosaukums']}")
    
    print("\n5. Creating Results...")
    completed_olympiads = [o for o in olympiads.values() if o.datums < today]
    print(f"  Found {len(completed_olympiads)} completed olympiads (date < {today})")
    
    if not completed_olympiads:
        print("  ⚠ No completed olympiads found! Check if olympiad dates are in the past.")
    else:
        normal_users = [u for u in users.values() if u.user_type == "normal"]
        print(f"  Found {len(normal_users)} normal users")
        
        if not normal_users:
            print("  ⚠ No normal users found! Cannot create results.")
        else:
            for olympiad in completed_olympiads:

                deleted_count = Rezultats.objects.filter(olimpiade=olympiad).delete()[0]
                if deleted_count > 0:
                    print(f"  - Deleted {deleted_count} existing results for: {olympiad.nosaukums}")
                

                if "Angļu valodas olimpiāde 2024" in olympiad.nosaukums:
                    num_participants = min(random.randint(40, 60), len(normal_users))
                else:

                    num_participants = min(random.randint(15, 25), len(normal_users))
                
                participants = random.sample(normal_users, num_participants)
                
                max_points = random.randint(120, 150)
                results_created = 0
                
                try:

                    participant_scores = []
                    for i, participant in enumerate(participants):
                        base_score = max_points - i * random.uniform(2, 4)
                        score = max(0, min(max_points, round(base_score + random.uniform(-2, 2), 1)))
                        participant_scores.append((participant, score))

                    participant_scores.sort(key=lambda x: x[1], reverse=True)
                    
                    for rank, (participant, score) in enumerate(participant_scores, start=1):
                        Rezultats.objects.create(
                            olimpiade=olympiad,
                            lietotajs=participant,
                            vieta=rank,
                            punktuSkaits=score,
                            rezultataDatums=olympiad.datums + timedelta(days=1)
                        )
                        results_created += 1
                    
                    print(f"  ✓ Created {results_created} results for: {olympiad.nosaukums} (date: {olympiad.datums})")
                except Exception as e:
                    print(f"  ✗ Error creating results for {olympiad.nosaukums}: {str(e)}")
                    import traceback
                    traceback.print_exc()
    
    print("\n6. Creating Applications...")
    upcoming_olympiads = [o for o in olympiads.values() if o.datums >= today]
    completed_olympiads = [o for o in olympiads.values() if o.datums < today]
    normal_users_list = [u for u in users.values() if u.user_type == "normal"]
    
    applications_created = 0
    
    for olympiad in upcoming_olympiads:
        applicants = random.sample(normal_users_list, min(random.randint(5, 15), len(normal_users_list)))
        
        for applicant in applicants:
            if not Pieteikums.objects.filter(olimpiade=olympiad, lietotajs=applicant).exists():
                status_choices = ["Reģistrēts", "Apstrādē", "Atteikts"]
                weights = [0.4, 0.4, 0.2]
                status = random.choices(status_choices, weights=weights)[0]
                
                Pieteikums.objects.create(
                    olimpiade=olympiad,
                    lietotajs=applicant,
                    statuss=status,
                    pieteikumaDatums=olympiad.datums - timedelta(days=random.randint(5, 30))
                )
                applications_created += 1
    

    for olympiad in completed_olympiads:
        result_users = [r.lietotajs for r in Rezultats.objects.filter(olimpiade=olympiad) if r.lietotajs]
        if result_users:
            for participant in result_users:
                if not Pieteikums.objects.filter(olimpiade=olympiad, lietotajs=participant).exists():
                    Pieteikums.objects.create(
                        olimpiade=olympiad,
                        lietotajs=participant,
                        statuss="Beidzies",
                        pieteikumaDatums=olympiad.datums - timedelta(days=random.randint(10, 60))
                    )
                    applications_created += 1
    
    print(f"  ✓ Created {applications_created} applications")
    
    print("\n" + "=" * 50)
    print("Sample data creation completed!")
    print("\nSummary:")
    print(f"  - Prieksmeti: {Prieksmets.objects.count()}")
    print(f"  - Schools: {Skola.objects.count()}")
    print(f"  - Users: {User.objects.count()} (normal: {User.objects.filter(user_type='normal').count()}, teachers: {User.objects.filter(user_type='teacher').count()}, admins: {User.objects.filter(user_type='admin').count()})")
    print(f"  - Olympiads: {Olimpiade.objects.count()}")
    print(f"  - Results: {Rezultats.objects.count()}")
    print(f"  - Applications: {Pieteikums.objects.count()}")
    print("\nDefault password for all created users: Password123")

if __name__ == "__main__":
    create_sample_data()

