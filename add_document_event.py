import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

injection = '''
    # 5. Create HealthEvent
    try:
        import json
        payload_data = {}
        try:
            payload_data = json.loads(extracted_insights)
        except:
            payload_data = {"raw_insights": extracted_insights}
            
        new_event = models.HealthEvent(
            patient_id=patient.id,
            type=models.HealthEventType.document,
            payload=payload_data,
            source_ref_id=str(new_doc.id)
        )
        db.add(new_event)
        await db.commit()
    except Exception as e:
        print(f"Error creating HealthEvent: {e}")
'''

# Find the end of the upload function:
#     await db.refresh(new_doc)
#     return {
content = content.replace("    await db.refresh(new_doc)\n    \n    return {", "    await db.refresh(new_doc)\n    \n" + injection + "\n    return {")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected HealthEvent creation into documents/upload")
