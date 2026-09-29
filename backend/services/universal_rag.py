import logging
from ddgs import DDGS

logger = logging.getLogger(__name__)

TRUSTED_DOMAINS = [
    "medlineplus.gov",
    "mayoclinic.org",
    "nih.gov",
    "who.int",
    "cdc.gov",
    "msdmanuals.com",
    "paho.org"
]

def search_universal_medical_knowledge(query: str, max_results: int = 3) -> str:
    """
    Realiza una búsqueda web restringida a instituciones médicas de prestigio.
    Retorna un string formateado con los resultados para inyectar en el LLM.
    """
    logger.info(f"Universal RAG buscando: {query}")
    site_query = " OR ".join([f"site:{domain}" for domain in TRUSTED_DOMAINS])
    full_query = f"{query} {site_query}"
    
    try:
        ddgs = DDGS()
        results = ddgs.text(full_query, max_results=max_results)
        
        if not results:
            return "No se encontraron resultados en fuentes médicas oficiales para esta consulta."
            
        context = "\n--- RESULTADOS DE BÚSQUEDA (RAG UNIVERSAL) ---\n"
        for idx, res in enumerate(results):
            context += f"\n[Fuente {idx+1}: {res.get('title', '')}]\n"
            context += f"URL: {res.get('href', '')}\n"
            context += f"Extracto: {res.get('body', '')}\n"
            
        context += "------------------------------------------------\n"
        return context
    except Exception as e:
        logger.error(f"Error en Universal RAG: {str(e)}")
        return "Error al consultar la base de datos médica universal."

# Definición de la herramienta (Tool) para OpenAI
UNIVERSAL_RAG_TOOL = {
    "type": "function",
    "function": {
        "name": "search_medical_literature",
        "description": "Busca información médica oficial y confiable en repositorios públicos (NIH, OMS, Mayo Clinic, etc.). Úsala SIEMPRE que el paciente pregunte sobre síntomas, enfermedades, tratamientos o dudas de salud para no responder de memoria y evitar alucinaciones.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Términos de búsqueda clave (ej. 'síntomas de diabetes tipo 2', 'tratamiento hipertensión')"
                }
            },
            "required": ["query"]
        }
    }
}
