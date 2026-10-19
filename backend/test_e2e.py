import urllib.request
import json
import uuid

BASE = 'http://127.0.0.1:8000/api'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post_json(path, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f'{BASE}{path}', data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print('=== 1. Testing Health Endpoint ===')
health = get('/health')
print('Health:', health)
assert health['status'] == 'healthy'

print('=== 2. Testing Subjects List ===')
subjects = get('/subjects')
print(f"Found {len(subjects)} subjects. First subject: {subjects[0]['name']}")
sub_id = subjects[0]['id']

print('=== 3. Testing PYQ Upload with Sample PDF ===')
boundary = uuid.uuid4().hex
with open('sample_docs/Operating_Systems_PYQ_2023.pdf', 'rb') as f:
    file_bytes = f.read()

parts = [
    f'--{boundary}\r\nContent-Disposition: form-data; name="subject_id"\r\n\r\n{sub_id}\r\n'.encode('utf-8'),
    f'--{boundary}\r\nContent-Disposition: form-data; name="exam_year"\r\n\r\n2023\r\n'.encode('utf-8'),
    f'--{boundary}\r\nContent-Disposition: form-data; name="exam_session"\r\n\r\nWinter End-Semester\r\n'.encode('utf-8'),
    f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="Operating_Systems_PYQ_2023.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode('utf-8') + file_bytes + b'\r\n',
    f'--{boundary}--\r\n'.encode('utf-8')
]
multipart_body = b''.join(parts)

req = urllib.request.Request(
    f'{BASE}/pyq/upload',
    data=multipart_body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)
with urllib.request.urlopen(req) as resp:
    upload_res = json.loads(resp.read().decode('utf-8'))
print(f"Uploaded PYQ successfully! Extracted {upload_res['total_extracted']} questions from PDF.")
assert upload_res['total_extracted'] > 0

print('=== 4. Testing Daily Practice Quiz Generation (10 Questions) ===')
detail = get(f'/subjects/{sub_id}')
ch1_id = detail['chapters'][0]['id']
ch1_name = detail['chapters'][0]['name']

quiz_req = {
    'subject_id': sub_id,
    'chapter_id': ch1_id,
    'num_questions': 10,
    'mode': 'Standard'
}
quiz_res = post_json('/quiz/generate', quiz_req)
print(f"Quiz generated: '{quiz_res['title']}' with {len(quiz_res['questions'])} questions.")
assert len(quiz_res['questions']) == 10

print('=== 5. Testing Quiz Submission & Instant Scoring ===')
quiz_id = quiz_res['quiz_id']
answers = [{'question_id': q['id'], 'answer': 'B'} for q in quiz_res['questions']]
submit_res = post_json('/quiz/submit', {'quiz_id': quiz_id, 'answers': answers})
print(f"Quiz Scored: {submit_res['score']}/{submit_res['total_marks']} ({submit_res['accuracy_percent']}%)")
print(f"Readiness Index Updated: {submit_res['readiness_index_updated']}, Priority Level: {submit_res['priority_level']}")
assert submit_res['is_completed'] is True

print('=== 6. Testing Dual-AI 1-Page Summary Revision Notes ===')
notes_req = {
    'subject_id': sub_id,
    'chapter_id': ch1_id,
    'force_regenerate': True
}
notes_res = post_json('/notes/generate', notes_req)
print(f"Dual Notes Generated for '{notes_res['chapter_name']}':")
print(f"- Gemini Summary Length: {len(notes_res['gemini_summary_md'])} chars")
print(f"- OpenAI Summary Length: {len(notes_res['openai_summary_md'])} chars")
print(f"- Key Formulas: {len(notes_res['key_formulas'])} items, Pitfalls: {len(notes_res['pitfalls'])} items")
assert len(notes_res['gemini_summary_md']) > 100
assert len(notes_res['openai_summary_md']) > 100

print('=== 7. Testing Markdown & PDF Export Endpoints ===')
req_md = urllib.request.Request(f'{BASE}/notes/export/markdown/{ch1_id}')
with urllib.request.urlopen(req_md) as resp:
    md_content = resp.read().decode('utf-8')
    print(f"Markdown exported successfully ({len(md_content)} bytes).")
    assert 'Dual-AI High-Yield Exam Revision Notes' in md_content

req_pdf = urllib.request.Request(f'{BASE}/notes/export/pdf/{ch1_id}')
with urllib.request.urlopen(req_pdf) as resp:
    pdf_content = resp.read()
    print(f"PDF exported successfully ({len(pdf_content)} bytes). Header: {pdf_content[:5]}")
    assert pdf_content.startswith(b'%PDF')

print('=== 8. Testing Strategic Exam Readiness Report & 4-Quadrant Focus Matrix ===')
readiness = get(f'/analytics/subject/{sub_id}')
print(f"Overall Readiness Index: {readiness['overall_readiness_index']}%")
print(f"Completed Chapters: {readiness['completed_chapters_count']}/{readiness['total_chapters_count']}")
print(f"Urgent Topics Count: {len(readiness['urgent_topics'])}")
print(f"Tactical Recommendation: {readiness['recommendation'][:100]}...")

print('=== 9. Testing Weightage Distribution Update ===')
weight_update = {
    'subject_id': sub_id,
    'total_marks': 100.0,
    'chapters': [
        {'chapter_id': c['id'], 'weightage_marks': 20.0} for c in detail['chapters']
    ]
}
weight_res = post_json('/analytics/weightage', weight_update)
print('Weightage updated. Overall Readiness:', weight_res['overall_readiness_index'])

print('\n>>> ALL 9 END-TO-END PIPELINE CHECKS PASSED WITH 100% SUCCESS! <<<')
