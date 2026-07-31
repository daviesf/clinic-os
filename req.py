import requests
import concurrent.futures
import time

url = "https://submit-form.com/DR7cYV8ma"

dados = {
    "??????????": "??????",
}

def enviar_requisicao():
    try:
        response = requests.post(url, json=dados, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        return response.status_code
    except requests.exceptions.RequestException as e:
        return "Erro de conexão"

# Configurações do teste
NUM_REQUISICOES = 100000  # Total de requisições a serem enviadas
CONCORRENCIA = 100      # Número de requisições simultâneas (threads)

print(f"Iniciando teste de carga...")
print(f"URL: {url}")
print(f"Total de requisições: {NUM_REQUISICOES}")
print(f"Concorrência: {CONCORRENCIA}\n")

inicio = time.time()

# Disparando as requisições de forma concorrente
with concurrent.futures.ThreadPoolExecutor(max_workers=CONCORRENCIA) as executor:
    # Mapeia a função enviar_requisicao para o número total de requisições
    resultados = list(executor.map(lambda _: enviar_requisicao(), range(NUM_REQUISICOES)))

fim = time.time()

# Resumo simples dos resultados
contagem_status = {}
for status in resultados:
    contagem_status[status] = contagem_status.get(status, 0) + 1

print("--- Resultados do Teste ---")
print(f"Tempo total: {fim - inicio:.2f} segundos")
for status, quantidade in contagem_status.items():
    print(f"Status/Resultado '{status}': {quantidade} requisições")