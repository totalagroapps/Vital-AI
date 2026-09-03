import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the new endpoint right after the /api/auth/register endpoint.
register_endpoint_regex = re.compile(r'(@app\.post\("/api/auth/register"\).*?)(@app\.post\("/api/auth/login"\))', re.DOTALL)

new_endpoint = '''
from fastapi import Form, UploadFile, File

@app.post("/api/auth/register-doctor")
async def register_doctor(
    username: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    specialty: str = Form(...),
    license_number: str = Form(...),
    experience_years: int = Form(...),
    location: str = Form(...),
    languages: str = Form(...),
    bio: str = Form(None),
    diploma_file: UploadFile = File(None),
    profile_pic_file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db)
):
    # 1. Check if user already exists
    result = await db.execute(select(models.User).where(models.User.username == username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="El usuario/correo ya está registrado")

    # 2. Upload files if provided
    diploma_url = None
    profile_pic_url = None
    
    if diploma_file and s3_client:
        diploma_bytes = await diploma_file.read()
        diploma_key = f"doctors/diplomas/{uuid.uuid4()}_{diploma_file.filename}"
        try:
            s3_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=diploma_key,
                Body=diploma_bytes,
                ContentType=diploma_file.content_type
            )
            diploma_url = diploma_key
        except ClientError as e:
            print(f"S3 Upload Error: {e}")
            raise HTTPException(status_code=500, detail="Error subiendo el diploma.")

    if profile_pic_file and s3_client:
        pic_bytes = await profile_pic_file.read()
        pic_key = f"doctors/profiles/{uuid.uuid4()}_{profile_pic_file.filename}"
        try:
            s3_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=pic_key,
                Body=pic_bytes,
                ContentType=profile_pic_file.content_type
            )
            profile_pic_url = pic_key
        except ClientError as e:
            print(f"S3 Upload Error: {e}")
            raise HTTPException(status_code=500, detail="Error subiendo la foto de perfil.")

    # 3. Create User
    new_user = models.User(
        username=username,
        hashed_password=get_password_hash(password),
        role="doctor"
    )
    db.add(new_user)
    await db.flush() # flush to get new_user.id
    
    # 4. Create SpecialistProfile
    new_profile = models.SpecialistProfile(
        user_id=new_user.id,
        full_name=full_name,
        specialty=specialty,
        license_number=license_number,
        experience_years=experience_years,
        location=location,
        languages=languages,
        bio=bio,
        diploma_url=diploma_url,
        profile_pic_url=profile_pic_url,
        is_verified=False
    )
    db.add(new_profile)
    await db.commit()
    
    # 5. Return JWT token so they log in immediately
    access_token = create_access_token(data={"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role}

'''

content = register_endpoint_regex.sub(r'\1' + new_endpoint + r'\n\n\2', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Endpoint added")
