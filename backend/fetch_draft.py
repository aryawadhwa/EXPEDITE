import requests
headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzJ0ZXN0MTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxNzY5NTIyMDYwLjU3MTg1fQ.fqBpUFLwTViy_sP5fbBW2uLM8FnCTzCsdevoNV_AvBg"}
r = requests.get("http://127.0.0.1:8000/api/v1/reviews/pending", headers=headers)
with open("draft_output.txt", "w") as f:
    f.write(r.text)
