import requests
try:
    response = requests.post('http://localhost:5000/api/generate-rules', 
                             json={'prompt': 'Quero um ranking de leitura onde cada livro vale 100 pontos'})
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(e)
