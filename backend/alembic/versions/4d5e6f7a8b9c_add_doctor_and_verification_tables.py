"""add_doctor_and_verification_tables

Revision ID: 4d5e6f7a8b9c
Revises: 3c4d5e6f7a8b
Create Date: 2026-09-10 17:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '4d5e6f7a8b9c'
down_revision: Union[str, Sequence[str], None] = '3c4d5e6f7a8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    # 1. specialties
    if 'specialties' not in existing_tables:
        op.create_table(
            'specialties',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index(op.f('ix_specialties_id'), 'specialties', ['id'], unique=False)
        op.create_index(op.f('ix_specialties_name'), 'specialties', ['name'], unique=True)

    # 2. doctors
    if 'doctors' not in existing_tables:
        op.create_table(
            'doctors',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('first_name', sa.Text(), nullable=False),
            sa.Column('last_name', sa.Text(), nullable=False),
            sa.Column('date_of_birth', sa.String(), nullable=True),
            sa.Column('residence_country', sa.String(length=100), nullable=True),
            sa.Column('phone', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
            sa.Column('verification_status', sa.String(length=20), server_default='pending', nullable=False),
            sa.Column('medical_license', sa.String(length=100), nullable=False),
            sa.Column('professional_registration_number', sa.String(length=100), nullable=True),
            sa.Column('professional_college', sa.String(length=150), nullable=True),
            sa.Column('college_country', sa.String(length=100), nullable=True),
            sa.Column('specialty', sa.String(length=150), nullable=False),
            sa.Column('subspecialties', sa.String(length=255), nullable=True),
            sa.Column('years_of_experience', sa.Integer(), nullable=True),
            sa.Column('professional_description', sa.Text(), nullable=True),
            sa.Column('experience', sa.Text(), nullable=True),
            sa.Column('language', sa.String(length=10), server_default='es', nullable=False),
            sa.Column('consultation_phone', sa.Text(), nullable=True),
            sa.Column('website', sa.String(length=255), nullable=True),
            sa.Column('address', sa.Text(), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=True),
            sa.Column('country', sa.String(length=100), nullable=True),
            sa.Column('postal_code', sa.String(length=20), nullable=True),
            sa.Column('latitude', sa.Float(), nullable=True),
            sa.Column('longitude', sa.Float(), nullable=True),
            sa.Column('identity_document_url', sa.Text(), nullable=True),
            sa.Column('professional_registration_certificate_url', sa.Text(), nullable=True),
            sa.Column('profile_picture_url', sa.Text(), nullable=True),
            sa.Column('presentation_video_url', sa.Text(), nullable=True),
            sa.Column('data_policy_accepted', sa.Boolean(), server_default='0', nullable=False),
            sa.Column('data_policy_accepted_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index(op.f('ix_doctors_id'), 'doctors', ['id'], unique=False)
        op.create_index(op.f('ix_doctors_user_id'), 'doctors', ['user_id'], unique=True)
        op.create_index(op.f('ix_doctors_medical_license'), 'doctors', ['medical_license'], unique=True)
        op.create_index(op.f('ix_doctors_specialty'), 'doctors', ['specialty'], unique=False)
        op.create_index(op.f('ix_doctors_verification_status'), 'doctors', ['verification_status'], unique=False)

    # 3. doctor_specialties
    if 'doctor_specialties' not in existing_tables:
        op.create_table(
            'doctor_specialties',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
            sa.Column('specialty_id', sa.Integer(), sa.ForeignKey('specialties.id', ondelete='CASCADE'), nullable=False),
            sa.Column('is_primary', sa.Boolean(), server_default='0', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
            sa.UniqueConstraint('doctor_id', 'specialty_id', name='uq_doctor_specialty'),
        )
        op.create_index(op.f('ix_doctor_specialties_id'), 'doctor_specialties', ['id'], unique=False)
        op.create_index(op.f('ix_doctor_specialties_doctor_id'), 'doctor_specialties', ['doctor_id'], unique=False)
        op.create_index(op.f('ix_doctor_specialties_specialty_id'), 'doctor_specialties', ['specialty_id'], unique=False)

    # 4. doctor_educations
    if 'doctor_educations' not in existing_tables:
        op.create_table(
            'doctor_educations',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
            sa.Column('institution', sa.Text(), nullable=False),
            sa.Column('degree', sa.Text(), nullable=False),
            sa.Column('field_of_study', sa.Text(), nullable=True),
            sa.Column('education_type', sa.String(length=50), nullable=True),
            sa.Column('start_year', sa.Integer(), nullable=True),
            sa.Column('end_year', sa.Integer(), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index(op.f('ix_doctor_educations_id'), 'doctor_educations', ['id'], unique=False)
        op.create_index(op.f('ix_doctor_educations_doctor_id'), 'doctor_educations', ['doctor_id'], unique=False)

    # 5. doctor_media
    if 'doctor_media' not in existing_tables:
        op.create_table(
            'doctor_media',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
            sa.Column('media_type', sa.String(length=50), nullable=False),
            sa.Column('file_url', sa.Text(), nullable=False),
            sa.Column('file_name', sa.Text(), nullable=True),
            sa.Column('mime_type', sa.String(length=100), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index(op.f('ix_doctor_media_id'), 'doctor_media', ['id'], unique=False)
        op.create_index(op.f('ix_doctor_media_doctor_id'), 'doctor_media', ['doctor_id'], unique=False)

    # 6. medical_verifications
    if 'medical_verifications' not in existing_tables:
        op.create_table(
            'medical_verifications',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False),
            sa.Column('verifier_id', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index(op.f('ix_medical_verifications_id'), 'medical_verifications', ['id'], unique=False)
        op.create_index(op.f('ix_medical_verifications_doctor_id'), 'medical_verifications', ['doctor_id'], unique=False)
        op.create_index(op.f('ix_medical_verifications_status'), 'medical_verifications', ['status'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    if 'medical_verifications' in existing_tables:
        op.drop_table('medical_verifications')
    if 'doctor_media' in existing_tables:
        op.drop_table('doctor_media')
    if 'doctor_educations' in existing_tables:
        op.drop_table('doctor_educations')
    if 'doctor_specialties' in existing_tables:
        op.drop_table('doctor_specialties')
    if 'doctors' in existing_tables:
        op.drop_table('doctors')
    if 'specialties' in existing_tables:
        op.drop_table('specialties')
