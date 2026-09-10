"""add_missing_columns_and_chat_session_index

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-09-10 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '3c4d5e6f7a8b'
down_revision: Union[str, Sequence[str], None] = '2b3c4d5e6f7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1. patient_profiles (height, weight)
    existing_patient_cols = [c['name'] for c in insp.get_columns('patient_profiles')]
    if 'height' not in existing_patient_cols:
        op.add_column('patient_profiles', sa.Column('height', sa.String(), nullable=True))
    if 'weight' not in existing_patient_cols:
        op.add_column('patient_profiles', sa.Column('weight', sa.String(), nullable=True))

    # 2. document_metadata (user_id, analysis_result)
    existing_doc_cols = [c['name'] for c in insp.get_columns('document_metadata')]
    if 'user_id' not in existing_doc_cols:
        op.add_column('document_metadata', sa.Column('user_id', sa.String(), nullable=True))
        op.create_index(op.f('ix_document_metadata_user_id'), 'document_metadata', ['user_id'], unique=False)
    if 'analysis_result' not in existing_doc_cols:
        op.add_column('document_metadata', sa.Column('analysis_result', sa.String(), nullable=True))

    # 3. specialist_profiles (id_doc_url)
    existing_spec_cols = [c['name'] for c in insp.get_columns('specialist_profiles')]
    if 'id_doc_url' not in existing_spec_cols:
        op.add_column('specialist_profiles', sa.Column('id_doc_url', sa.String(), nullable=True))

    # 4. chat_messages (index on session_id)
    existing_chat_indexes = [idx['name'] for idx in insp.get_indexes('chat_messages')]
    if 'ix_chat_messages_session_id' not in existing_chat_indexes:
        op.create_index(op.f('ix_chat_messages_session_id'), 'chat_messages', ['session_id'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    existing_chat_indexes = [idx['name'] for idx in insp.get_indexes('chat_messages')]
    if 'ix_chat_messages_session_id' in existing_chat_indexes:
        op.drop_index(op.f('ix_chat_messages_session_id'), table_name='chat_messages')

    existing_spec_cols = [c['name'] for c in insp.get_columns('specialist_profiles')]
    if 'id_doc_url' in existing_spec_cols:
        op.drop_column('specialist_profiles', 'id_doc_url')

    existing_doc_cols = [c['name'] for c in insp.get_columns('document_metadata')]
    if 'analysis_result' in existing_doc_cols:
        op.drop_column('document_metadata', 'analysis_result')
    if 'user_id' in existing_doc_cols:
        existing_doc_indexes = [idx['name'] for idx in insp.get_indexes('document_metadata')]
        if 'ix_document_metadata_user_id' in existing_doc_indexes:
            op.drop_index(op.f('ix_document_metadata_user_id'), table_name='document_metadata')
        op.drop_column('document_metadata', 'user_id')

    existing_patient_cols = [c['name'] for c in insp.get_columns('patient_profiles')]
    if 'weight' in existing_patient_cols:
        op.drop_column('patient_profiles', 'weight')
    if 'height' in existing_patient_cols:
        op.drop_column('patient_profiles', 'height')
