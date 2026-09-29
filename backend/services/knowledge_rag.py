import os
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# ==============================================================================
# MIVOR RAG SERVICE (Option 2)
# ==============================================================================
# Este modulo esta preparado para recibir la Base de Conocimiento (PDFs)
# de Dahiana el viernes. Utilizara la API de Vector Stores de OpenAI.
# ==============================================================================

async def setup_vector_store(store_name: str = "MIVOR_Protocolos_Medicos"):
    """
    Crea un Vector Store en OpenAI (Caja fuerte de conocimiento).
    """
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    # vector_store = await client.beta.vector_stores.create(name=store_name)
    # return vector_store.id
    pass

async def upload_guideline_pdf(vector_store_id: str, file_path: str):
    """
    Sube los PDFs de Dahiana al Vector Store para hacer RAG.
    """
    client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    # with open(file_path, "rb") as f:
    #     await client.beta.vector_stores.file_batches.upload_and_poll(
    #         vector_store_id=vector_store_id, files=[f]
    #     )
    pass
