import os
import sys
import json
import asyncio
from datetime import datetime, date, timedelta

# Asegurar que el path incluya el directorio backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import database
import models
from security import get_password_hash
from sqlalchemy.future import select

async def seed_data():
    print("[START] Iniciando creación de tablas y población de usuario médico demo MIVOR.ai...")

    # 1. Asegurar tablas creadas
    async with database.engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    print("[OK] Tablas de base de datos verificadas y creadas.")

    async with database.AsyncSessionLocal() as session:
        # 2. Crear / Actualizar Doctor de Demostración
        doctor_username = "doctor@mivor.ai"
        doctor_alias = "dr.mivor"
        doctor_password = "Doctor123!"
        hashed_pw = get_password_hash(doctor_password)

        doctor_users = [
            {"username": doctor_username, "id": "doc-alejandro-ruiz"},
            {"username": doctor_alias, "id": "doc-alejandro-alias"}
        ]

        for d_info in doctor_users:
            res = await session.execute(select(models.User).where(models.User.username == d_info["username"]))
            existing_doc = res.scalars().first()
            if not existing_doc:
                new_doc = models.User(
                    id=d_info["id"],
                    username=d_info["username"],
                    hashed_password=hashed_pw,
                    role="doctor"
                )
                session.add(new_doc)
                print(f"[DOCTOR] Usuario médico creado: {d_info['username']} (Password: {doctor_password})")
            else:
                existing_doc.hashed_password = hashed_pw
                existing_doc.role = "doctor"
                print(f"[DOCTOR] Usuario médico actualizado: {d_info['username']}")

        await session.commit()

        # Specialist Profile para el doctor
        spec_res = await session.execute(select(models.SpecialistProfile).where(models.SpecialistProfile.user_id == "doc-alejandro-ruiz"))
        spec_profile = spec_res.scalars().first()
        if not spec_profile:
            spec_profile = models.SpecialistProfile(
                user_id="doc-alejandro-ruiz",
                full_name="Dr. Alejandro Ruiz",
                specialty="Medicina General y Urgencias",
                license_number="COL-482910",
                experience_years=12,
                city="Madrid, España",
                location="Centro Clínico MIVOR.ai / Telemedicina",
                languages="Español, Inglés",
                bio="Especialista en Medicina Familiar, Urgencias Clínicas y Triaje Médico Digital en MIVOR.ai. Más de 12 años coordinando equipos médicos de atención ambulatoria y hospitalaria.",
                verified=True,
                is_verified=True,
                photo_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80",
                availability_schedule={"dias": "Lunes a Viernes", "horario": "08:30 - 18:30"}
            )
            session.add(spec_profile)
            print("[PROFILE] Perfil de especialista del Dr. Alejandro Ruiz creado.")
        else:
            spec_profile.full_name = "Dr. Alejandro Ruiz"
            spec_profile.specialty = "Medicina General y Urgencias"
            spec_profile.verified = True
            spec_profile.is_verified = True

        await session.commit()

        # 3. 15 Pacientes Completos
        patients_data = [
            {
                "user_id": "patient-carlos-gomez",
                "full_name": "Carlos Gómez Morales",
                "dob": "1972-04-14",
                "gender": "Masculino",
                "blood": "A+",
                "allergies": "Penicilina, Sulfamidas",
                "chronic": "Hipertensión arterial, Cardiopatía isquémica previa",
                "meds": "Enalapril 20mg, Aspirina 100mg, Atorvastatina 40mg",
                "emergency": "+34 612 345 678 (Esposa - Marta)",
                "height": "178",
                "weight": "84",
                "triage_category": "Rojo",
                "triage_report": "Paciente refiere opresión precordial de 40 minutos de evolución irradiada a mandíbula y brazo izquierdo, acompañada de diaforesis y disnea. Requiere electrocardiograma y biomarcadores cardíacos inmediatos.",
                "specialty": "Cardiología / Urgencias",
                "reminders": [
                    {"name": "Enalapril", "dosage": "20mg", "freq": "Cada 12 horas", "time": "08:00, 20:00"},
                    {"name": "Aspirina", "dosage": "100mg", "freq": "Cada 24 horas con almuerzo", "time": "14:00"},
                    {"name": "Atorvastatina", "dosage": "40mg", "freq": "Cada 24 horas noche", "time": "22:00"}
                ]
            },
            {
                "user_id": "patient-maria-torres",
                "full_name": "María Fernanda Torres",
                "dob": "1984-08-22",
                "gender": "Femenino",
                "blood": "O+",
                "allergies": "AINEs (Ibuprofeno)",
                "chronic": "Migraña crónica con aura, Hipotiroidismo subclínico",
                "meds": "Levotiroxina 50mcg, Triptanes según crisis, Magnesio",
                "emergency": "+34 623 456 789 (Hermana - Sofía)",
                "height": "165",
                "weight": "62",
                "triage_category": "Amarillo",
                "triage_report": "Episodio de cefalea hemicraneana pulsátil de 6 horas de duración refractaria a analgesia habitual, náuseas y fotofobia intensa.",
                "specialty": "Neurología",
                "reminders": [
                    {"name": "Levotiroxina", "dosage": "50mcg", "freq": "Ayunas diario", "time": "07:30"},
                    {"name": "Zolmitriptán", "dosage": "2.5mg", "freq": "En fase de aura o dolor agudo", "time": "Según necesidad"}
                ]
            },
            {
                "user_id": "patient-mohamed-amrani",
                "full_name": "Mohamed Amrani",
                "dob": "1965-11-03",
                "gender": "Masculino",
                "blood": "B+",
                "allergies": "Ninguna conocida",
                "chronic": "Diabetes Mellitus tipo 2, Retinopatía diabética no proliferativa",
                "meds": "Metformina 850mg, Insulina Glargina 18 UI, Empagliflozina 10mg",
                "emergency": "+34 634 567 890 (Hijo - Youssef)",
                "height": "172",
                "weight": "89",
                "triage_category": "Amarillo",
                "triage_report": "Glucemias capilares matutinas sostenidas superiores a 260 mg/dL, poliuria y polidipsia de 3 días de evolución sin signos de cetoacidosis.",
                "specialty": "Endocrinología",
                "reminders": [
                    {"name": "Metformina", "dosage": "850mg", "freq": "Con desayuno y cena", "time": "08:30, 21:00"},
                    {"name": "Insulina Glargina", "dosage": "18 UI", "freq": "Antes de acostarse", "time": "23:00"},
                    {"name": "Empagliflozina", "dosage": "10mg", "freq": "Cada mañana", "time": "09:00"}
                ]
            },
            {
                "user_id": "patient-lucia-benitez",
                "full_name": "Lucía Benítez",
                "dob": "1997-02-18",
                "gender": "Femenino",
                "blood": "A-",
                "allergies": "Polen de olivo, Ácaros del polvo",
                "chronic": "Asma bronquial alérgica persistente moderada",
                "meds": "Budesonida/Formoterol 160/4.5mcg, Salbutamol rescate",
                "emergency": "+34 645 678 901 (Madre - Carmen)",
                "height": "168",
                "weight": "58",
                "triage_category": "Verde",
                "triage_report": "Control rutinario de función pulmonar. Tos esporádica nocturna tras ejercicio físico. Buena respuesta al inhalador de rescate.",
                "specialty": "Neumología",
                "reminders": [
                    {"name": "Budesonida/Formoterol", "dosage": "160/4.5 mcg", "freq": "2 inhalaciones cada 12h", "time": "08:00, 20:00"},
                    {"name": "Salbutamol", "dosage": "100mcg", "freq": "1-2 inhalaciones si disnea", "time": "Rescate"}
                ]
            },
            {
                "user_id": "patient-jorge-morales",
                "full_name": "Jorge Morales Rivas",
                "dob": "1958-09-12",
                "gender": "Masculino",
                "blood": "AB+",
                "allergies": "Contraste yodado",
                "chronic": "Fibrilación auricular no valvular, Hipertensión arterial",
                "meds": "Apixabán 5mg, Bisoprolol 5mg, Losartán 50mg",
                "emergency": "+34 656 789 012 (Hija - Elena)",
                "height": "170",
                "weight": "80",
                "triage_category": "Rojo",
                "triage_report": "Episodio de pérdida transitoria de fuerza en extremidad superior derecha y dificultad articulatoria del habla de 15 min de duración. Sospecha de AIT.",
                "specialty": "Neurología / Código Ictus",
                "reminders": [
                    {"name": "Apixabán", "dosage": "5mg", "freq": "Cada 12 horas", "time": "09:00, 21:00"},
                    {"name": "Bisoprolol", "dosage": "5mg", "freq": "Cada mañana", "time": "09:00"}
                ]
            },
            {
                "user_id": "patient-carmen-delgado",
                "full_name": "Carmen Delgado Morales",
                "dob": "1989-06-30",
                "gender": "Femenino",
                "blood": "O-",
                "allergies": "Látex",
                "chronic": "Colon irritable, Gastritis crónica antral",
                "meds": "Omeprazol 20mg, Probióticos, Butilescopolamina",
                "emergency": "+34 667 890 123 (Esposo - Fernando)",
                "height": "162",
                "weight": "54",
                "triage_category": "Amarillo",
                "triage_report": "Dolor abdominal agudo focalizado en fosa ilíaca derecha, sensación febril de 38°C y náuseas. Requiere descarte de apendicitis aguda vs patología anexial.",
                "specialty": "Cirugía General / Ginecología",
                "reminders": [
                    {"name": "Omeprazol", "dosage": "20mg", "freq": "Ayunas diario", "time": "08:00"}
                ]
            },
            {
                "user_id": "patient-david-soto",
                "full_name": "David Soto Barrientos",
                "dob": "1981-12-05",
                "gender": "Masculino",
                "blood": "A+",
                "allergies": "Ninguna conocida",
                "chronic": "Hipertensión esencial grado 1",
                "meds": "Olmesartán 20mg",
                "emergency": "+34 678 901 234 (Hermano - Daniel)",
                "height": "182",
                "weight": "88",
                "triage_category": "Verde",
                "triage_report": "Revisión anual rutinaria de cifras tensionales con MAPA. Presiones medias de 128/82 mmHg en domicilio. Excelente adherencia al tratamiento.",
                "specialty": "Medicina General",
                "reminders": [
                    {"name": "Olmesartán", "dosage": "20mg", "freq": "Cada 24 horas", "time": "08:30"}
                ]
            },
            {
                "user_id": "patient-sofia-navarro",
                "full_name": "Sofía Navarro Pardo",
                "dob": "2003-05-14",
                "gender": "Femenino",
                "blood": "B-",
                "allergies": "Frutos secos (cacahuetes), Amoxicilina",
                "chronic": "Dermatitis atópica severa",
                "meds": "Ebastina 20mg, Crema hidratante con ceramidas, Corticoide tópico",
                "emergency": "+34 689 012 345 (Padre - Mario)",
                "height": "164",
                "weight": "52",
                "triage_category": "Amarillo",
                "triage_report": "Brote alérgico generalizado con placas eritematosas pruriginosas en cuello y pliegues tras ingesta accidental. Sin compromiso de vía aérea.",
                "specialty": "Alergología / Dermatología",
                "reminders": [
                    {"name": "Ebastina", "dosage": "20mg", "freq": "Una vez al día", "time": "21:00"}
                ]
            },
            {
                "user_id": "patient-andres-vega",
                "full_name": "Andrés Vega Lozano",
                "dob": "1968-07-19",
                "gender": "Masculino",
                "blood": "O+",
                "allergies": "Ninguna conocida",
                "chronic": "Dislipidemia mixta, Hígado graso no alcohólico",
                "meds": "Rosuvastatina 10mg, Ácidos grasos Omega 3",
                "emergency": "+34 690 123 456 (Esposa - Rosa)",
                "height": "176",
                "weight": "85",
                "triage_category": "Verde",
                "triage_report": "Seguimiento de perfil lipídico. Colesterol total 178 mg/dL, triglicéridos 142 mg/dL. Transaminasas normales. Ecografía hepática estable.",
                "specialty": "Medicina Interna",
                "reminders": [
                    {"name": "Rosuvastatina", "dosage": "10mg", "freq": "Por la noche", "time": "22:00"}
                ]
            },
            {
                "user_id": "patient-elena-montero",
                "full_name": "Elena Montero Salas",
                "dob": "1992-10-27",
                "gender": "Femenino",
                "blood": "A+",
                "allergies": "Metamizol (Nolotil)",
                "chronic": "Tiroiditis de Hashimoto, Anemia ferropénica crónica",
                "meds": "Levotiroxina 75mcg, Sulfato ferroso 80mg",
                "emergency": "+34 601 234 567 (Madre - Laura)",
                "height": "160",
                "weight": "55",
                "triage_category": "Amarillo",
                "triage_report": "Astenia intensa de un mes de evolución, caída capilar y ganancia ponderal de 4 kg sin cambio en la dieta. TSH elevada a 7.4 mUI/L.",
                "specialty": "Endocrinología",
                "reminders": [
                    {"name": "Levotiroxina", "dosage": "75mcg", "freq": "Ayunas estricto", "time": "07:00"},
                    {"name": "Sulfato ferroso", "dosage": "80mg", "freq": "Con zumo de naranja en ayunas", "time": "09:00"}
                ]
            },
            {
                "user_id": "patient-raul-pacheco",
                "full_name": "Raúl Pacheco Guirao",
                "dob": "1954-03-08",
                "gender": "Masculino",
                "blood": "AB-",
                "allergies": "Ninguna conocida",
                "chronic": "Insuficiencia Cardíaca con fracción de eyección reducida (IC-FEr 35%), Fibrilación auricular",
                "meds": "Sacubitrilo/Valsartán 49/51mg, Furosemida 40mg, Dapagliflozina 10mg, Espironolactona 25mg",
                "emergency": "+34 612 987 654 (Hijo - Roberto)",
                "height": "169",
                "weight": "79",
                "triage_category": "Rojo",
                "triage_report": "Disnea paroxística nocturna, ortopnea a 3 almohadas y aumento de edemas en miembros inferiores hasta rodillas. Ganancia de 3 kg en 48h.",
                "specialty": "Cardiología / Insuficiencia Cardíaca",
                "reminders": [
                    {"name": "Sacubitrilo/Valsartán", "dosage": "49/51mg", "freq": "Cada 12 horas", "time": "08:00, 20:00"},
                    {"name": "Furosemida", "dosage": "40mg", "freq": "Cada mañana", "time": "08:00"},
                    {"name": "Dapagliflozina", "dosage": "10mg", "freq": "Una vez al día", "time": "09:00"}
                ]
            },
            {
                "user_id": "patient-isabella-mendoza",
                "full_name": "Isabella Mendoza Castro",
                "dob": "2007-08-11",
                "gender": "Femenino",
                "blood": "O+",
                "allergies": "Ninguna conocida",
                "chronic": "Sin antecedentes patológicos",
                "meds": "Vitamina D3 1000 UI",
                "emergency": "+34 623 876 543 (Madre - Lucía)",
                "height": "170",
                "weight": "59",
                "triage_category": "Verde",
                "triage_report": "Evaluación médica para ingreso a federación deportiva universitaria. Examen cardiopulmonar normal, auscultación limpia sin soplos.",
                "specialty": "Medicina Deportiva / General",
                "reminders": [
                    {"name": "Vitamina D3", "dosage": "1000 UI", "freq": "Diario", "time": "09:00"}
                ]
            },
            {
                "user_id": "patient-gabriel-ortiz",
                "full_name": "Gabriel Ortiz Serrano",
                "dob": "1976-11-29",
                "gender": "Masculino",
                "blood": "B+",
                "allergies": "Ninguna conocida",
                "chronic": "Discopatía lumbar L4-L5, Hernia discal paramedial",
                "meds": "Pregabalina 75mg, Paracetamol 1g, Diazepam 5mg",
                "emergency": "+34 634 765 432 (Esposa - Teresa)",
                "height": "175",
                "weight": "82",
                "triage_category": "Amarillo",
                "triage_report": "Lumbociatalgia izquierda irradiada por cara posterior del muslo hasta talón con parestesias. Maniobra de Lasègue positiva a 45 grados.",
                "specialty": "Traumatología / Unidad del Dolor",
                "reminders": [
                    {"name": "Pregabalina", "dosage": "75mg", "freq": "Cada 12 horas", "time": "09:00, 21:00"},
                    {"name": "Paracetamol", "dosage": "1g", "freq": "Cada 8 horas si dolor", "time": "Según dolor"}
                ]
            },
            {
                "user_id": "patient-natalia-rivas",
                "full_name": "Natalia Rivas Gil",
                "dob": "1985-01-16",
                "gender": "Femenino",
                "blood": "A-",
                "allergies": "Ciprofloxacino",
                "chronic": "Ovario poliquístico, Resistencia a la insulina leve",
                "meds": "Mio-Inositol, Metformina 500mg, Ácido fólico",
                "emergency": "+34 645 654 321 (Pareja - Carlos)",
                "height": "163",
                "weight": "64",
                "triage_category": "Verde",
                "triage_report": "Chequeo gineco-endocrino de control. Ciclos menstruales regularizados con estilo de vida e inositol. Glucemia y curva de insulina dentro de objetivo.",
                "specialty": "Ginecología / Endocrinología",
                "reminders": [
                    {"name": "Mio-Inositol", "dosage": "4g", "freq": "Diario con desayuno", "time": "08:30"},
                    {"name": "Metformina", "dosage": "500mg", "freq": "Con almuerzo", "time": "14:00"}
                ]
            },
            {
                "user_id": "patient-roberto-silva",
                "full_name": "Roberto Silva Campos",
                "dob": "1963-06-04",
                "gender": "Masculino",
                "blood": "O+",
                "allergies": "Aspirina (provoca broncoespasmo)",
                "chronic": "EPOC fenotipo no agudizador (exfumador 35 paquetes/año)",
                "meds": "Tiotropio/Olodaterol Respimat, N-Acetilcisteína 600mg",
                "emergency": "+34 656 543 210 (Hija - Mónica)",
                "height": "173",
                "weight": "77",
                "triage_category": "Amarillo",
                "triage_report": "Incremento de expectoración mucosa y disnea de moderados esfuerzos coincidente con cambio estacional. Saturación de O2 basal 94%.",
                "specialty": "Neumología",
                "reminders": [
                    {"name": "Tiotropio/Olodaterol", "dosage": "2 inhalaciones", "freq": "Cada 24 horas", "time": "09:00"},
                    {"name": "N-Acetilcisteína", "dosage": "600mg", "freq": "Disuelto en agua diario", "time": "12:00"}
                ]
            }
        ]

        print(f"[PACK] Procesando {len(patients_data)} pacientes...")

        for p_data in patients_data:
            # User
            u_res = await session.execute(select(models.User).where(models.User.username == p_data["user_id"]))
            user_obj = u_res.scalars().first()
            if not user_obj:
                user_obj = models.User(
                    id=p_data["user_id"],
                    username=p_data["user_id"],
                    hashed_password=get_password_hash("Paciente123!"),
                    role="patient"
                )
                session.add(user_obj)

            # PatientProfile
            prof_res = await session.execute(select(models.PatientProfile).where(models.PatientProfile.user_id == p_data["user_id"]))
            prof = prof_res.scalars().first()
            if not prof:
                prof = models.PatientProfile(
                    user_id=p_data["user_id"],
                    full_name=p_data["full_name"],
                    date_of_birth=p_data["dob"],
                    gender=p_data["gender"],
                    blood_type=p_data["blood"],
                    allergies=p_data["allergies"],
                    chronic_conditions=p_data["chronic"],
                    current_medications=p_data["meds"],
                    emergency_contact=p_data["emergency"],
                    height=p_data["height"],
                    weight=p_data["weight"],
                    preferred_language="es"
                )
                session.add(prof)
            else:
                prof.full_name = p_data["full_name"]
                prof.date_of_birth = p_data["dob"]
                prof.gender = p_data["gender"]
                prof.blood_type = p_data["blood"]
                prof.allergies = p_data["allergies"]
                prof.chronic_conditions = p_data["chronic"]
                prof.current_medications = p_data["meds"]
                prof.emergency_contact = p_data["emergency"]
                prof.height = p_data["height"]
                prof.weight = p_data["weight"]

            # TriageSession
            tr_res = await session.execute(select(models.TriageSession).where(models.TriageSession.user_id == p_data["user_id"]))
            triage_item = tr_res.scalars().first()
            if not triage_item:
                triage_item = models.TriageSession(
                    user_id=p_data["user_id"],
                    category=p_data["triage_category"],
                    questions_asked=5,
                    status="closed_" + p_data["triage_category"].lower(),
                    final_report=p_data["triage_report"],
                    recommended_specialty=p_data["specialty"]
                )
                session.add(triage_item)

            # Reminders
            for rem in p_data["reminders"]:
                rem_res = await session.execute(select(models.MedicationReminder).where(
                    models.MedicationReminder.user_id == p_data["user_id"],
                    models.MedicationReminder.medication_name == rem["name"]
                ))
                if not rem_res.scalars().first():
                    new_rem = models.MedicationReminder(
                        user_id=p_data["user_id"],
                        medication_name=rem["name"],
                        dosage=rem["dosage"],
                        frequency=rem["freq"],
                        time_of_day=rem["time"],
                        is_active=True
                    )
                    session.add(new_rem)

        await session.commit()
        print("[OK] 15 Pacientes, triajes y recordatorios clínicos creados con éxito.")

        # 4. Crear Agenda Médica Completa de Citas (Appointments)
        today_date = date.today()
        tomorrow_date = today_date + timedelta(days=1)
        day_after_date = today_date + timedelta(days=2)
        next_day_date = today_date + timedelta(days=3)

        today_s = today_date.strftime("%Y-%m-%d")
        tomorrow_s = tomorrow_date.strftime("%Y-%m-%d")
        day_after_s = day_after_date.strftime("%Y-%m-%d")
        next_day_s = next_day_date.strftime("%Y-%m-%d")

        appointments_to_seed = [
            # --- HOY (Citas clave para la demo) ---
            {
                "patient_id": "patient-carlos-gomez",
                "patient_name": "Carlos Gómez Morales",
                "patient_age": 54,
                "patient_gender": "Masculino",
                "blood_type": "A+",
                "appointment_date": today_s,
                "appointment_time": "08:30",
                "duration_minutes": 30,
                "reason": "Revisión urgente post-triaje por dolor torácico opresivo con disnea",
                "appointment_type": "presencial",
                "status": "en_espera",
                "triage_category": "Rojo",
                "notes": "Paciente en sala de espera. Trae ECG previo."
            },
            {
                "patient_id": "patient-mohamed-amrani",
                "patient_name": "Mohamed Amrani",
                "patient_age": 61,
                "patient_gender": "Masculino",
                "blood_type": "B+",
                "appointment_date": today_s,
                "appointment_time": "09:15",
                "duration_minutes": 30,
                "reason": "Descompensación glucémica y ajuste de dosis de insulina glargina",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Amarillo",
                "notes": "Revisión de glucemias capilares en ayunas."
            },
            {
                "patient_id": "patient-maria-torres",
                "patient_name": "María Fernanda Torres",
                "patient_age": 42,
                "patient_gender": "Femenino",
                "blood_type": "O+",
                "appointment_date": today_s,
                "appointment_time": "10:00",
                "duration_minutes": 30,
                "reason": "Teleconsulta de seguimiento por crisis migrañosa refractaria",
                "appointment_type": "teleconsulta",
                "status": "confirmada",
                "triage_category": "Amarillo",
                "notes": "Videollamada para valorar cambio de triptán."
            },
            {
                "patient_id": "patient-carmen-delgado",
                "patient_name": "Carmen Delgado Morales",
                "patient_age": 37,
                "patient_gender": "Femenino",
                "blood_type": "O-",
                "appointment_date": today_s,
                "appointment_time": "11:00",
                "duration_minutes": 30,
                "reason": "Evaluación de dolor agudo en fosa ilíaca derecha y ecografía abdominal",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Amarillo",
                "notes": "Descarte de apendicitis vs patología anexial."
            },
            {
                "patient_id": "patient-david-soto",
                "patient_name": "David Soto Barrientos",
                "patient_age": 45,
                "patient_gender": "Masculino",
                "blood_type": "A+",
                "appointment_date": today_s,
                "appointment_time": "12:00",
                "duration_minutes": 20,
                "reason": "Chequeo de rutina de tensión arterial y renovación de receta",
                "appointment_type": "presencial",
                "status": "completada",
                "triage_category": "Verde",
                "notes": "Cifras tensionales 124/80 mmHg. Excelente control."
            },
            {
                "patient_id": "patient-lucia-benitez",
                "patient_name": "Lucía Benítez",
                "patient_age": 29,
                "patient_gender": "Femenino",
                "blood_type": "A-",
                "appointment_date": today_s,
                "appointment_time": "16:30",
                "duration_minutes": 30,
                "reason": "Teleconsulta de control asmático tras ejercicio físico",
                "appointment_type": "teleconsulta",
                "status": "confirmada",
                "triage_category": "Verde",
                "notes": "Revisión de técnica de uso de inhalador."
            },

            # --- MAÑANA ---
            {
                "patient_id": "patient-raul-pacheco",
                "patient_name": "Raúl Pacheco Guirao",
                "patient_age": 72,
                "patient_gender": "Masculino",
                "blood_type": "AB-",
                "appointment_date": tomorrow_s,
                "appointment_time": "09:00",
                "duration_minutes": 45,
                "reason": "Revisión prioritaria de insuficiencia cardíaca con edemas en EEII",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Rojo",
                "notes": "Ajuste de dosis de furosemida y peso matutino."
            },
            {
                "patient_id": "patient-elena-montero",
                "patient_name": "Elena Montero Salas",
                "patient_age": 34,
                "patient_gender": "Femenino",
                "blood_type": "A+",
                "appointment_date": tomorrow_s,
                "appointment_time": "10:30",
                "duration_minutes": 30,
                "reason": "Lectura de analítica de perfil tiroideo (TSH 7.4) y ajuste de levotiroxina",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Amarillo",
                "notes": "Prescribir analítica con anticuerpos anti-TPO."
            },
            {
                "patient_id": "patient-sofia-navarro",
                "patient_name": "Sofía Navarro Pardo",
                "patient_age": 23,
                "patient_gender": "Femenino",
                "blood_type": "B-",
                "appointment_date": tomorrow_s,
                "appointment_time": "11:30",
                "duration_minutes": 30,
                "reason": "Seguimiento de brote alérgico cutáneo y pruebas epicutáneas",
                "appointment_type": "teleconsulta",
                "status": "confirmada",
                "triage_category": "Amarillo",
                "notes": "Valorar derivación a Alergología hospitalaria."
            },
            {
                "patient_id": "patient-andres-vega",
                "patient_name": "Andrés Vega Lozano",
                "patient_age": 58,
                "patient_gender": "Masculino",
                "blood_type": "O+",
                "appointment_date": tomorrow_s,
                "appointment_time": "12:15",
                "duration_minutes": 30,
                "reason": "Control semestral de esteatosis hepática y dieta mediterránea",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Verde",
                "notes": "Revisión de analítica con GPT y GGT."
            },

            # --- DÍA SIGUIENTE / RESTO DE LA SEMANA ---
            {
                "patient_id": "patient-jorge-morales",
                "patient_name": "Jorge Morales Rivas",
                "patient_age": 68,
                "patient_gender": "Masculino",
                "blood_type": "AB+",
                "appointment_date": day_after_s,
                "appointment_time": "09:30",
                "duration_minutes": 45,
                "reason": "Valoración post-episodio de AIT transitorio y ecodoppler de carótidas",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Rojo",
                "notes": "Coordinación con servicio de Neurología."
            },
            {
                "patient_id": "patient-gabriel-ortiz",
                "patient_name": "Gabriel Ortiz Serrano",
                "patient_age": 50,
                "patient_gender": "Masculino",
                "blood_type": "B+",
                "appointment_date": day_after_s,
                "appointment_time": "11:00",
                "duration_minutes": 30,
                "reason": "Evaluación de RMN de columna lumbosacra por lumbociática aguda",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Amarillo",
                "notes": "Pautar pauta descendente de corticoides orales si persiste dolor."
            },
            {
                "patient_id": "patient-isabella-mendoza",
                "patient_name": "Isabella Mendoza Castro",
                "patient_age": 19,
                "patient_gender": "Femenino",
                "blood_type": "O+",
                "appointment_date": next_day_s,
                "appointment_time": "10:00",
                "duration_minutes": 20,
                "reason": "Entrega de certificado médico y resultados de espirometría",
                "appointment_type": "presencial",
                "status": "confirmada",
                "triage_category": "Verde",
                "notes": "Apta para práctica deportiva de competición."
            },
            {
                "patient_id": "patient-roberto-silva",
                "patient_name": "Roberto Silva Campos",
                "patient_age": 63,
                "patient_gender": "Masculino",
                "blood_type": "O+",
                "appointment_date": next_day_s,
                "appointment_time": "11:15",
                "duration_minutes": 30,
                "reason": "Teleconsulta de seguimiento de EPOC y oximetría ambulatoria",
                "appointment_type": "teleconsulta",
                "status": "confirmada",
                "triage_category": "Amarillo",
                "notes": "Valorar vacunación neumocócica y antigripal."
            }
        ]

        # Limpiar citas previas del doctor para que no se dupliquen al re-ejecutar
        from sqlalchemy import delete
        await session.execute(delete(models.Appointment).where(
            (models.Appointment.doctor_id == "doc-alejandro-ruiz") | 
            (models.Appointment.doctor_id == "doctor@mivor.ai") |
            (models.Appointment.doctor_id == "all")
        ))

        for appt_dict in appointments_to_seed:
            new_appt = models.Appointment(
                doctor_id="doctor@mivor.ai", # vinculado al usuario demo
                patient_id=appt_dict["patient_id"],
                patient_name=appt_dict["patient_name"],
                patient_age=appt_dict["patient_age"],
                patient_gender=appt_dict["patient_gender"],
                blood_type=appt_dict["blood_type"],
                appointment_date=appt_dict["appointment_date"],
                appointment_time=appt_dict["appointment_time"],
                duration_minutes=appt_dict["duration_minutes"],
                reason=appt_dict["reason"],
                appointment_type=appt_dict["appointment_type"],
                status=appt_dict["status"],
                triage_category=appt_dict["triage_category"],
                notes=appt_dict["notes"]
            )
            session.add(new_appt)

        await session.commit()
        print(f"[CALENDAR] {len(appointments_to_seed)} Citas médicas creadas en la agenda del doctor.")

    print("\n[SUCCESS] POBLACIÓN COMPLETADA CON ÉXITO:")
    print("--------------------------------------------------")
    print("[DOCTOR] Credenciales de Médico de Prueba:")
    print("   Usuario:    doctor@mivor.ai  (o alias: dr.mivor)")
    print("   Contraseña: Doctor123!")
    print("   Rol:        doctor")
    print("   Perfil:     Dr. Alejandro Ruiz (Medicina General y Urgencias)")
    print("--------------------------------------------------")
    print("[PATIENTS] Pacientes creados: 15 pacientes completos con historial y triajes.")
    print(f"[CALENDAR] Citas hoy ({today_s}): 6 citas en agenda (Rojo, Amarillo, Verde).")
    print(f"[CALENDAR] Citas mañana ({tomorrow_s}): 4 citas en agenda.")
    print(f"[CALENDAR] Citas próximos días: 4 citas en agenda.")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(seed_data())
