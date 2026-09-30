import io
import html
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


def _safe_escape(text: str) -> str:
    """Escapes strings for ReportLab Paragraphs (which parse XML/HTML tags)."""
    if not text:
        return ""
    return html.escape(str(text))


def generate_clinical_pdf(data: dict, filename: str = "documento.pdf") -> bytes:
    """
    Generates a professional clinical PDF report using ReportLab.
    Includes patient/document metadata, severity badge, clinical summary,
    presumptive diagnoses, laboratory biomarkers table, historical comparison table,
    suggested questions for doctor, and action recommendations.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Brand and UI Palette
    brand_teal = colors.HexColor("#0f766e")
    brand_dark = colors.HexColor("#0f172a")
    slate_600 = colors.HexColor("#475569")
    slate_800 = colors.HexColor("#1e293b")
    border_color = colors.HexColor("#cbd5e1")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=brand_teal
    )
    sub_title_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=slate_600
    )
    meta_title = ParagraphStyle(
        "MetaTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=slate_800,
        alignment=2
    )
    meta_val = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=slate_600,
        alignment=2
    )
    
    sec_heading = ParagraphStyle(
        "SecHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=brand_teal,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=slate_800
    )
    bullet_style = ParagraphStyle(
        "DocBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=slate_800,
        leftIndent=12
    )
    
    table_head = ParagraphStyle(
        "THead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    table_cell = ParagraphStyle(
        "TCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=slate_800
    )
    table_cell_bold = ParagraphStyle(
        "TCellB",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=slate_800
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7,
        leading=9.5,
        textColor=slate_600
    )

    story = []

    # 1. Header Banner
    header_table = Table([
        [
            [
                Paragraph("MIVOR.ai", title_style),
                Paragraph("Plataforma Cl\u00ednica Inteligente de An\u00e1lisis y Seguimiento", sub_title_style)
            ],
            [
                Paragraph("INFORME DE EVALUACI\u00d3N CL\u00cdNICA", meta_title),
                Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", meta_val)
            ]
        ]
    ], colWidths=[320, 220])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=brand_teal, spaceBefore=0, spaceAfter=8))

    # 2. Metadata & Severity Card
    severidad = str(data.get("severidad", "verde")).lower()
    if severidad == "rojo":
        sev_bg = colors.HexColor("#fef2f2")
        sev_text_color = colors.HexColor("#dc2626")
        sev_border = colors.HexColor("#f87171")
        sev_label = "URGENCIA M\u00c9DICA / ATENCI\u00d3N INMEDIATA"
    elif severidad == "amarillo":
        sev_bg = colors.HexColor("#fffbeb")
        sev_text_color = colors.HexColor("#d97706")
        sev_border = colors.HexColor("#fcd34d")
        sev_label = "ATENCI\u00d3N M\u00c9DICA PRIORITARIA"
    else:
        sev_bg = colors.HexColor("#f0fdf4")
        sev_text_color = colors.HexColor("#16a34a")
        sev_border = colors.HexColor("#86efac")
        sev_label = "CONTROL DE RUTINA / NORMAL"

    sev_style = ParagraphStyle(
        "SevStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=sev_text_color,
        alignment=1
    )

    clean_fn = _safe_escape(filename)
    info_data = [
        [
            Paragraph(f"<b>Archivo analizado:</b> {clean_fn}", body_style),
            Paragraph(f"<b>Estado cl\u00ednico:</b> {sev_label}", sev_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[320, 220])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#f8fafc")),
        ("BACKGROUND", (1, 0), (1, 0), sev_bg),
        ("BOX", (0, 0), (0, 0), 0.5, border_color),
        ("BOX", (1, 0), (1, 0), 1, sev_border),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    # 3. Clinical Summary
    summary = data.get("resumen") or data.get("summary") or "An\u00e1lisis cl\u00ednico completado."
    story.append(Paragraph("1. RESUMEN CL\u00cdNICO", sec_heading))
    story.append(Paragraph(_safe_escape(summary), body_style))
    story.append(Spacer(1, 8))

    # 4. Diagnoses & Findings
    diagnosticos = data.get("diagnosticos", [])
    hallazgos = data.get("hallazgos", [])
    if diagnosticos or hallazgos:
        story.append(Paragraph("2. DIAGN\u00d3STICOS Y HALLAZGOS PRINCIPALES", sec_heading))
        if diagnosticos:
            for d in diagnosticos:
                story.append(Paragraph(f"&bull; <b>Diagn\u00f3stico:</b> {_safe_escape(d)}", bullet_style))
        if hallazgos:
            for h in hallazgos:
                story.append(Paragraph(f"&bull; {_safe_escape(h)}", bullet_style))
        story.append(Spacer(1, 8))

    # 5. Laboratory Biomarkers Table
    biomarcadores = data.get("biomarcadores", [])
    if biomarcadores:
        story.append(Paragraph("3. PAR\u00c1METROS Y BIOMARCADORES DE LABORATORIO", sec_heading))
        bm_rows = [
            [
                Paragraph("Par\u00e1metro", table_head),
                Paragraph("Valor Obtenido", table_head),
                Paragraph("Rango Referencia", table_head),
                Paragraph("Estado Cl\u00ednico", table_head)
            ]
        ]
        for bm in biomarcadores:
            estado = str(bm.get("estado", "normal")).lower()
            val_str = f"{bm.get('valor', '')} {bm.get('unidad', '')}".strip()
            ref_str = str(bm.get("rango_referencia", "-"))
            
            if estado == "elevado":
                st_color = "#dc2626"
                st_label = "ELEVADO &uarr;"
            elif estado == "bajo":
                st_color = "#2563eb"
                st_label = "BAJO &darr;"
            else:
                st_color = "#16a34a"
                st_label = "NORMAL &#10003;"

            st_style = ParagraphStyle(
                "StStyle",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=10,
                textColor=colors.HexColor(st_color)
            )

            bm_rows.append([
                Paragraph(_safe_escape(bm.get("parametro", "")), table_cell_bold),
                Paragraph(_safe_escape(val_str), table_cell),
                Paragraph(_safe_escape(ref_str), table_cell),
                Paragraph(st_label, st_style)
            ])

        bm_table = Table(bm_rows, colWidths=[170, 110, 150, 110])
        bm_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), brand_teal),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ]))
        story.append(bm_table)
        story.append(Spacer(1, 8))

    # 6. Historical Comparison Table
    comparativa = data.get("comparativa_historica", [])
    if comparativa:
        story.append(Paragraph("4. COMPARATIVA HIST\u00d3RICA Y EVOLUCI\u00d3N TEMPORAL", sec_heading))
        comp_rows = [
            [
                Paragraph("Par\u00e1metro", table_head),
                Paragraph("Valor Previo (Fecha)", table_head),
                Paragraph("Valor Actual", table_head),
                Paragraph("Variaci\u00f3n", table_head),
                Paragraph("Tendencia", table_head)
            ]
        ]
        for c in comparativa:
            diff_val = c.get("diferencia", 0)
            pct_val = c.get("cambio_porcentual", 0)
            diff_str = f"{diff_val:+g} ({pct_val:+g}%)"
            tend = str(c.get("tendencia", "estable")).lower()
            if "sube" in tend:
                tend_icon = "INCREMENTA &uarr;"
                tend_color = "#dc2626" if c.get("estado_actual") == "elevado" else "#0f766e"
            elif "baja" in tend:
                tend_icon = "DISMINUYE &darr;"
                tend_color = "#2563eb" if c.get("estado_actual") == "bajo" else "#0f766e"
            else:
                tend_icon = "ESTABLE ="
                tend_color = "#64748b"

            tend_style = ParagraphStyle(
                "TendStyle",
                parent=styles["Normal"],
                fontName="Helvetica-Bold",
                fontSize=8,
                leading=10,
                textColor=colors.HexColor(tend_color)
            )

            prev_date_str = f" ({c.get('fecha_anterior', 'Previo')})" if c.get('fecha_anterior') else ""
            prev_cell_str = f"{c.get('valor_anterior', '')} {c.get('unidad', '')}{prev_date_str}".strip()
            cur_cell_str = f"{c.get('valor_actual', '')} {c.get('unidad', '')}".strip()

            comp_rows.append([
                Paragraph(_safe_escape(c.get("parametro", "")), table_cell_bold),
                Paragraph(_safe_escape(prev_cell_str), table_cell),
                Paragraph(_safe_escape(cur_cell_str), table_cell),
                Paragraph(_safe_escape(diff_str), table_cell),
                Paragraph(tend_icon, tend_style)
            ])

        comp_table = Table(comp_rows, colWidths=[150, 130, 90, 90, 80])
        comp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ]))
        story.append(comp_table)
        story.append(Spacer(1, 8))

    # 7. Medications
    medicamentos = data.get("medicamentos", [])
    if medicamentos:
        story.append(Paragraph("5. MEDICAMENTOS DETECTADOS", sec_heading))
        for m in medicamentos:
            story.append(Paragraph(f"&bull; {_safe_escape(m)}", bullet_style))
        story.append(Spacer(1, 8))

    # 8. Suggested Questions for Doctor
    preguntas = data.get("preguntas_medico", [])
    if preguntas:
        story.append(Paragraph("6. PREGUNTAS SUGERIDAS PARA SU CONSULTA M\u00c9DICA", sec_heading))
        for p in preguntas:
            story.append(Paragraph(f"&bull; {_safe_escape(p)}", bullet_style))
        story.append(Spacer(1, 8))

    # 9. Clinical Recommendations
    rec = data.get("recomendacion", "")
    if rec:
        story.append(Paragraph("7. RECOMENDACIONES Y PLAN DE ACCI\u00d3N", sec_heading))
        story.append(Paragraph(_safe_escape(rec), body_style))
        story.append(Spacer(1, 10))

    # 10. Medical Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=4, spaceAfter=6))
    story.append(Paragraph(
        "<b>Aviso Legal Informativo:</b> Este documento ha sido generado automáticamente por MIVOR.ai con fines exclusivamente divulgativos, de orientación general y de facilitación de la comprensión de la información de salud tanto para el paciente como para el profesional médico. MIVOR.ai no es un dispositivo médico, no realiza diagnósticos clínicos, triajes asistenciales ni prescripciones terapéuticas, y no sustituye la consulta ni el criterio clínico presencial de un profesional médico debidamente colegiado.",
        disclaimer_style
    ))

    doc.build(story)
    return buffer.getvalue()


def generate_prescription_pdf(data: dict) -> bytes:
    """
    Generates a professional Medical Prescription (Receta Medica) PDF using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Brand and UI Palette
    brand_teal = colors.HexColor("#0f766e")
    brand_dark = colors.HexColor("#0f172a")
    slate_600 = colors.HexColor("#475569")
    
    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'], fontSize=18, textColor=brand_teal, spaceAfter=20, alignment=1
    )
    header_style = ParagraphStyle(
        'HeaderStyle', parent=styles['Normal'], fontSize=10, textColor=slate_600, spaceAfter=2
    )
    section_style = ParagraphStyle(
        'SectionStyle', parent=styles['Heading2'], fontSize=14, textColor=brand_dark, spaceBefore=20, spaceAfter=10
    )
    med_name_style = ParagraphStyle(
        'MedNameStyle', parent=styles['Normal'], fontSize=12, textColor=colors.black, fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=2
    )
    med_inst_style = ParagraphStyle(
        'MedInstStyle', parent=styles['Normal'], fontSize=10, textColor=colors.black, spaceAfter=10, leftIndent=10
    )

    story = []

    # Title
    story.append(Paragraph("<b>RECETA MÉDICA</b>", title_style))
    
    # Header Info
    doctor_name = _safe_escape(data.get("doctor_name", "Dr. / Dra."))
    specialty = _safe_escape(data.get("specialty", "Medicina General"))
    license_num = _safe_escape(data.get("license", "No. Colegiado: _________"))
    
    patient_name = _safe_escape(data.get("patient_name", "______________________"))
    date_str = _safe_escape(data.get("date", datetime.now().strftime("%d/%m/%Y")))
    
    # Doctor Info
    story.append(Paragraph(f"<b>{doctor_name}</b>", ParagraphStyle('DocName', parent=styles['Normal'], fontSize=12, textColor=brand_dark)))
    story.append(Paragraph(f"Especialidad: {specialty}", header_style))
    story.append(Paragraph(f"Cédula/Licencia: {license_num}", header_style))
    story.append(Spacer(1, 15))
    
    # Patient Info
    story.append(HRFlowable(width="100%", thickness=1, color=brand_teal, spaceAfter=10, spaceBefore=5))
    story.append(Paragraph(f"<b>Paciente:</b> {patient_name} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Fecha:</b> {date_str}", ParagraphStyle('PatInfo', parent=styles['Normal'], fontSize=11)))
    story.append(HRFlowable(width="100%", thickness=1, color=brand_teal, spaceAfter=20, spaceBefore=10))

    # Medications (Rx)
    story.append(Paragraph("<b>Rx</b>", ParagraphStyle('Rx', parent=styles['Heading1'], fontSize=20, textColor=brand_dark, spaceAfter=15)))

    medications = data.get("medications", [])
    if not medications:
        story.append(Paragraph("<i>No se prescribieron medicamentos.</i>", header_style))
    else:
        for idx, med in enumerate(medications):
            m_name = _safe_escape(med.get("name", "Medicamento no especificado"))
            m_dose = _safe_escape(med.get("dose", ""))
            m_freq = _safe_escape(med.get("frequency", ""))
            m_dur = _safe_escape(med.get("duration", ""))
            m_inst = _safe_escape(med.get("instructions", ""))
            
            line1 = f"{idx+1}. <b>{m_name}</b> {m_dose}"
            story.append(Paragraph(line1, med_name_style))
            
            instructions = f"Tomar: {m_freq} por {m_dur}."
            if m_inst:
                instructions += f" Notas: {m_inst}"
            story.append(Paragraph(instructions, med_inst_style))

    # Footer (Sign/Stamp)
    story.append(Spacer(1, 60))
    story.append(Paragraph("________________________________________", ParagraphStyle('SignLine', parent=styles['Normal'], alignment=1)))
    story.append(Paragraph("Firma y Sello del Médico", ParagraphStyle('SignText', parent=styles['Normal'], alignment=1, textColor=slate_600, spaceBefore=5)))

    doc.build(story)
    return buffer.getvalue()
