"""consolidate_full_schema

Revision ID: 2b3c4d5e6f7a
Revises: 194d1dfd5a9c
Create Date: 2026-09-10 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b3c4d5e6f7a'
down_revision: Union[str, Sequence[str], None] = '194d1dfd5a9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Chat sessions & messages
    op.create_table(
        'chat_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_sessions_user_id'), 'chat_sessions', ['user_id'], unique=False)

    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_id'), 'chat_messages', ['id'], unique=False)

    # 2. Medication reminders & logs
    op.create_table(
        'medication_reminders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('medication_name', sa.String(), nullable=True),
        sa.Column('dosage', sa.String(), nullable=True),
        sa.Column('frequency', sa.String(), nullable=True),
        sa.Column('time_of_day', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medication_reminders_id'), 'medication_reminders', ['id'], unique=False)
    op.create_index(op.f('ix_medication_reminders_user_id'), 'medication_reminders', ['user_id'], unique=False)

    op.create_table(
        'medication_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('medication_id', sa.Integer(), nullable=True),
        sa.Column('taken_date', sa.String(), nullable=True),
        sa.Column('taken_time', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['medication_id'], ['medication_reminders.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medication_logs_id'), 'medication_logs', ['id'], unique=False)
    op.create_index(op.f('ix_medication_logs_taken_date'), 'medication_logs', ['taken_date'], unique=False)
    op.create_index(op.f('ix_medication_logs_user_id'), 'medication_logs', ['user_id'], unique=False)

    # 3. Appointments
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.String(), nullable=True),
        sa.Column('patient_id', sa.String(), nullable=True),
        sa.Column('patient_name', sa.String(), nullable=True),
        sa.Column('patient_age', sa.Integer(), nullable=True),
        sa.Column('patient_gender', sa.String(), nullable=True),
        sa.Column('blood_type', sa.String(), nullable=True),
        sa.Column('appointment_date', sa.String(), nullable=True),
        sa.Column('appointment_time', sa.String(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('appointment_type', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('triage_category', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointments_id'), 'appointments', ['id'], unique=False)
    op.create_index(op.f('ix_appointments_doctor_id'), 'appointments', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_appointments_patient_id'), 'appointments', ['patient_id'], unique=False)
    op.create_index(op.f('ix_appointments_appointment_date'), 'appointments', ['appointment_date'], unique=False)

    # 4. Additional columns for specialist_profiles
    op.add_column('specialist_profiles', sa.Column('license_number', sa.String(), nullable=True))
    op.add_column('specialist_profiles', sa.Column('experience_years', sa.Integer(), server_default='0', nullable=True))
    op.add_column('specialist_profiles', sa.Column('location', sa.String(), nullable=True))
    op.add_column('specialist_profiles', sa.Column('languages', sa.String(), nullable=True))
    op.add_column('specialist_profiles', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('specialist_profiles', sa.Column('is_verified', sa.Boolean(), server_default=sa.false(), nullable=True))
    op.add_column('specialist_profiles', sa.Column('diploma_url', sa.String(), nullable=True))
    op.add_column('specialist_profiles', sa.Column('profile_pic_url', sa.String(), nullable=True))
    op.add_column('specialist_profiles', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True))

    # 5. Additional columns for patient_profiles
    op.add_column('patient_profiles', sa.Column('organ_donor', sa.String(), server_default='No especificado', nullable=True))
    op.add_column('patient_profiles', sa.Column('medical_notes', sa.Text(), nullable=True))
    op.add_column('patient_profiles', sa.Column('insurance_provider', sa.String(), nullable=True))
    op.add_column('patient_profiles', sa.Column('preferred_language', sa.String(), server_default='es', nullable=True))


def downgrade() -> None:
    # Downgrade patient_profiles columns
    op.drop_column('patient_profiles', 'preferred_language')
    op.drop_column('patient_profiles', 'insurance_provider')
    op.drop_column('patient_profiles', 'medical_notes')
    op.drop_column('patient_profiles', 'organ_donor')

    # Downgrade specialist_profiles columns
    op.drop_column('specialist_profiles', 'created_at')
    op.drop_column('specialist_profiles', 'profile_pic_url')
    op.drop_column('specialist_profiles', 'diploma_url')
    op.drop_column('specialist_profiles', 'is_verified')
    op.drop_column('specialist_profiles', 'bio')
    op.drop_column('specialist_profiles', 'languages')
    op.drop_column('specialist_profiles', 'location')
    op.drop_column('specialist_profiles', 'experience_years')
    op.drop_column('specialist_profiles', 'license_number')

    # Drop tables
    op.drop_index(op.f('ix_appointments_appointment_date'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_doctor_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_id'), table_name='appointments')
    op.drop_table('appointments')

    op.drop_index(op.f('ix_medication_logs_user_id'), table_name='medication_logs')
    op.drop_index(op.f('ix_medication_logs_taken_date'), table_name='medication_logs')
    op.drop_index(op.f('ix_medication_logs_id'), table_name='medication_logs')
    op.drop_table('medication_logs')

    op.drop_index(op.f('ix_medication_reminders_user_id'), table_name='medication_reminders')
    op.drop_index(op.f('ix_medication_reminders_id'), table_name='medication_reminders')
    op.drop_table('medication_reminders')

    op.drop_index(op.f('ix_chat_messages_id'), table_name='chat_messages')
    op.drop_table('chat_messages')

    op.drop_index(op.f('ix_chat_sessions_user_id'), table_name='chat_sessions')
    op.drop_table('chat_sessions')
