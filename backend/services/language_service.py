"""Idiomas y ubicación para la IA y para la traducción dinámica de la interfaz.

`language_directive` construye la instrucción de idioma de todos los prompts (chat, triaje,
copiloto, análisis de documentos) para CUALQUIER idioma, no solo es/en/fr/ar, e incorpora
el país del usuario (terminología regional y número de emergencias local).
"""
import re
from typing import Optional

# código ISO 639-1 -> (nombre en inglés, nombre nativo)
LANGUAGES = {
    'af': ('Afrikaans', 'Afrikaans'), 'am': ('Amharic', 'አማርኛ'), 'ar': ('Arabic', 'العربية'),
    'az': ('Azerbaijani', 'Azərbaycan'), 'be': ('Belarusian', 'Беларуская'), 'bg': ('Bulgarian', 'Български'),
    'bn': ('Bengali', 'বাংলা'), 'bs': ('Bosnian', 'Bosanski'), 'ca': ('Catalan', 'Català'),
    'cs': ('Czech', 'Čeština'), 'cy': ('Welsh', 'Cymraeg'), 'da': ('Danish', 'Dansk'),
    'de': ('German', 'Deutsch'), 'el': ('Greek', 'Ελληνικά'), 'en': ('English', 'English'),
    'es': ('Spanish', 'Español'), 'et': ('Estonian', 'Eesti'), 'eu': ('Basque', 'Euskara'),
    'fa': ('Persian', 'فارسی'), 'fi': ('Finnish', 'Suomi'), 'fil': ('Filipino', 'Filipino'),
    'fr': ('French', 'Français'), 'ga': ('Irish', 'Gaeilge'), 'gl': ('Galician', 'Galego'),
    'gu': ('Gujarati', 'ગુજરાતી'), 'ha': ('Hausa', 'Hausa'), 'he': ('Hebrew', 'עברית'),
    'hi': ('Hindi', 'हिन्दी'), 'hr': ('Croatian', 'Hrvatski'), 'ht': ('Haitian Creole', 'Kreyòl ayisyen'),
    'hu': ('Hungarian', 'Magyar'), 'hy': ('Armenian', 'Հայերեն'), 'id': ('Indonesian', 'Bahasa Indonesia'),
    'ig': ('Igbo', 'Igbo'), 'is': ('Icelandic', 'Íslenska'), 'it': ('Italian', 'Italiano'),
    'ja': ('Japanese', '日本語'), 'ka': ('Georgian', 'ქართული'), 'kk': ('Kazakh', 'Қазақша'),
    'km': ('Khmer', 'ខ្មែរ'), 'kn': ('Kannada', 'ಕನ್ನಡ'), 'ko': ('Korean', '한국어'),
    'ku': ('Kurdish', 'Kurdî'), 'ky': ('Kyrgyz', 'Кыргызча'), 'lo': ('Lao', 'ລາວ'),
    'lt': ('Lithuanian', 'Lietuvių'), 'lv': ('Latvian', 'Latviešu'), 'mk': ('Macedonian', 'Македонски'),
    'ml': ('Malayalam', 'മലയാളം'), 'mn': ('Mongolian', 'Монгол'), 'mr': ('Marathi', 'मराठी'),
    'ms': ('Malay', 'Bahasa Melayu'), 'mt': ('Maltese', 'Malti'), 'my': ('Burmese', 'မြန်မာ'),
    'nb': ('Norwegian', 'Norsk'), 'ne': ('Nepali', 'नेपाली'), 'nl': ('Dutch', 'Nederlands'),
    'no': ('Norwegian', 'Norsk'), 'pa': ('Punjabi', 'ਪੰਜਾਬੀ'), 'pl': ('Polish', 'Polski'),
    'ps': ('Pashto', 'پښتو'), 'pt': ('Portuguese', 'Português'), 'qu': ('Quechua', 'Runasimi'),
    'ro': ('Romanian', 'Română'), 'ru': ('Russian', 'Русский'), 'si': ('Sinhala', 'සිංහල'),
    'sk': ('Slovak', 'Slovenčina'), 'sl': ('Slovenian', 'Slovenščina'), 'so': ('Somali', 'Soomaali'),
    'sq': ('Albanian', 'Shqip'), 'sr': ('Serbian', 'Српски'), 'sv': ('Swedish', 'Svenska'),
    'sw': ('Swahili', 'Kiswahili'), 'ta': ('Tamil', 'தமிழ்'), 'te': ('Telugu', 'తెలుగు'),
    'tg': ('Tajik', 'Тоҷикӣ'), 'th': ('Thai', 'ไทย'), 'tk': ('Turkmen', 'Türkmen'),
    'tl': ('Filipino', 'Filipino'), 'tr': ('Turkish', 'Türkçe'), 'uk': ('Ukrainian', 'Українська'),
    'ur': ('Urdu', 'اردو'), 'uz': ('Uzbek', 'Oʻzbek'), 'vi': ('Vietnamese', 'Tiếng Việt'),
    'yo': ('Yoruba', 'Yorùbá'), 'zh': ('Chinese (Simplified)', '简体中文'), 'zu': ('Zulu', 'isiZulu'),
}

# Idiomas con traducción de interfaz escrita a mano en el frontend (no se generan con IA)
STATIC_UI_LANGUAGES = {'es', 'en'}  # fr y ar tienen diccionario propio, pero la IA completa las claves que les falten

_TRADITIONAL_CHINESE_REGIONS = {'tw', 'hk', 'mo'}

# ISO 3166-1 alfa-2 -> (nombre del país, número de emergencias)
COUNTRIES = {
    'ES': ('Spain', '112'), 'MX': ('Mexico', '911'), 'CO': ('Colombia', '123'), 'AR': ('Argentina', '107'),
    'CL': ('Chile', '131'), 'PE': ('Peru', '106'), 'VE': ('Venezuela', '171'), 'EC': ('Ecuador', '911'),
    'UY': ('Uruguay', '911'), 'PY': ('Paraguay', '911'), 'BO': ('Bolivia', '110'), 'CR': ('Costa Rica', '911'),
    'PA': ('Panama', '911'), 'DO': ('Dominican Republic', '911'), 'GT': ('Guatemala', '128'),
    'HN': ('Honduras', '911'), 'SV': ('El Salvador', '911'), 'NI': ('Nicaragua', '118'), 'CU': ('Cuba', '104'),
    'PR': ('Puerto Rico', '911'), 'US': ('United States', '911'), 'CA': ('Canada', '911'),
    'GB': ('United Kingdom', '999'), 'IE': ('Ireland', '112'), 'FR': ('France', '15'), 'DE': ('Germany', '112'),
    'IT': ('Italy', '112'), 'PT': ('Portugal', '112'), 'NL': ('Netherlands', '112'), 'BE': ('Belgium', '112'),
    'CH': ('Switzerland', '144'), 'AT': ('Austria', '144'), 'SE': ('Sweden', '112'), 'NO': ('Norway', '113'),
    'DK': ('Denmark', '112'), 'FI': ('Finland', '112'), 'PL': ('Poland', '112'), 'CZ': ('Czechia', '112'),
    'GR': ('Greece', '112'), 'RO': ('Romania', '112'), 'HU': ('Hungary', '112'), 'TR': ('Turkey', '112'),
    'RU': ('Russia', '103'), 'UA': ('Ukraine', '103'), 'MA': ('Morocco', '150'), 'DZ': ('Algeria', '14'),
    'TN': ('Tunisia', '190'), 'EG': ('Egypt', '123'), 'SA': ('Saudi Arabia', '997'), 'AE': ('United Arab Emirates', '998'),
    'QA': ('Qatar', '999'), 'JO': ('Jordan', '911'), 'LB': ('Lebanon', '140'), 'IL': ('Israel', '101'),
    'IR': ('Iran', '115'), 'IQ': ('Iraq', '122'), 'IN': ('India', '112'), 'PK': ('Pakistan', '1122'),
    'BD': ('Bangladesh', '999'), 'CN': ('China', '120'), 'JP': ('Japan', '119'), 'KR': ('South Korea', '119'),
    'TH': ('Thailand', '1669'), 'VN': ('Vietnam', '115'), 'ID': ('Indonesia', '118'), 'PH': ('Philippines', '911'),
    'MY': ('Malaysia', '999'), 'SG': ('Singapore', '995'), 'AU': ('Australia', '000'), 'NZ': ('New Zealand', '111'),
    'BR': ('Brazil', '192'), 'ZA': ('South Africa', '10177'), 'NG': ('Nigeria', '112'), 'KE': ('Kenya', '999'),
}


def _split_tag(code: Optional[str]):
    tag = (code or '').strip().replace('_', '-').lower()
    parts = [p for p in tag.split('-') if p]
    primary = parts[0] if parts else ''
    region = next((p for p in parts[1:] if len(p) == 2 and p.isalpha()), '')
    script = next((p for p in parts[1:] if len(p) == 4 and p.isalpha()), '')
    return primary, region, script


def normalize_language(code: Optional[str], default: str = 'es') -> str:
    """Devuelve el código de idioma principal ('pt-BR' -> 'pt'); acepta cualquiera con formato ISO válido."""
    primary, _, _ = _split_tag(code)
    if re.fullmatch(r'[a-z]{2,3}', primary or ''):
        return primary
    return default


def is_supported_language(code: Optional[str]) -> bool:
    return normalize_language(code, '') in LANGUAGES


def language_label(code: Optional[str]) -> str:
    """'Portuguese (Português)'. Para códigos desconocidos indica el código ISO al modelo."""
    primary, region, script = _split_tag(code)
    if primary == 'zh' and (script == 'hant' or region in _TRADITIONAL_CHINESE_REGIONS):
        return 'Chinese (Traditional) (繁體中文)'
    if primary in LANGUAGES:
        en, native = LANGUAGES[primary]
        return en if en == native else f'{en} ({native})'
    if re.fullmatch(r'[a-z]{2,3}', primary or ''):
        return f'the language with ISO 639 code "{primary}"'
    return 'Spanish (Español)'


def normalize_country(country: Optional[str], language_tag: Optional[str] = None) -> str:
    """Código de país en mayúsculas: el indicado o la región de la etiqueta de idioma (es-CO -> CO)."""
    c = (country or '').strip().upper()
    if re.fullmatch(r'[A-Z]{2}', c):
        return c
    _, region, _ = _split_tag(language_tag)
    return region.upper() if region else ''


def country_context(country: Optional[str], language_tag: Optional[str] = None) -> str:
    cc = normalize_country(country, language_tag)
    if not cc:
        return ''
    name, emergency = COUNTRIES.get(cc, (cc, ''))
    text = (f'The user is located in {name} ({cc}). '
            'Use terminology, units, and healthcare-system references appropriate for that country.')
    if emergency:
        text += (f' For life-threatening emergencies tell them to call the local emergency number {emergency} '
                 '(this replaces any other emergency number mentioned earlier in these instructions).')
    else:
        text += (' For life-threatening emergencies tell them to call their local emergency services '
                 '(do not cite a specific number from earlier in these instructions).')
    return text


def language_directive(language: Optional[str], country: Optional[str] = None, audience: str = 'user') -> str:
    label = language_label(language)
    lines = [
        '',
        '',
        'CRITICAL LANGUAGE DIRECTIVE:',
        f"Communicate with the {audience} EXCLUSIVELY in {label}. "
        f"If the {audience}'s latest message is clearly written in a different language, reply in that language instead. "
        'Never mix languages in one reply, and do not answer in English or Spanish unless that is the required language.',
        'Compose greetings, clinical explanations, questions, and advice natively in that language '
        '(do not translate word by word), keeping drug names, units, and standard medical abbreviations understandable.',
    ]
    ctx = country_context(country, language)
    if ctx:
        lines.append(ctx)
    return '\n'.join(lines)
