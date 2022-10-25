import requests

content = requests.get("http://127.0.0.1:3000/")
print(content.status_code)