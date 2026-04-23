
import os
import sys
from datetime import datetime

# Configurações
output_filename = 'project_dump_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.txt'
root_path = os.getcwd() # Ou defina um caminho específico se necessário
output_filepath = os.path.join(root_path, output_filename)

# Pastas para ignorar (adicionar mais conforme necessário)
ignore_dirs = {
    'node_modules', '.git', 'dist', 'build', 'coverage', 
    '.vscode', '.idea', '__pycache__', 'venv', 'env', 
    '.next', '.nuxt', 'bin', 'obj', '.angular', 'tmp',
    'out', 'target'
}

# Arquivos específicos para ignorar
ignore_files = {
    'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 
    '.env', '.env.docker', '.env.development', '.env.test', '.env.production',
    '.DS_Store', 'Thumbs.db', output_filename, os.path.basename(__file__)
}

# Extensões para ignorar (binários, midia, etc)
ignore_extensions = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
    '.mp4', '.mp3', '.wav', '.ogg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.exe', '.dll', '.bin', '.pyc', '.zip', '.tar', '.gz', '.7z', '.rar',
    '.eot', '.ttf', '.woff', '.woff2', '.map'
}

def is_text_file(filepath):
    """Tenta ler um pouco do arquivo para ver se é binário/texto."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            f.read(1024)
        return True
    except (UnicodeDecodeError, IOError):
        return False

def main():
    print(f"Iniciando dump em: {output_filepath}")
    
    try:
        with open(output_filepath, 'w', encoding='utf-8') as outfile:
            for root, dirs, files in os.walk(root_path):
                # Modifica dirs in-place para pular pastas ignoradas recursivamente
                dirs[:] = [d for d in dirs if d not in ignore_dirs]
                
                for filename in files:
                    if filename in ignore_files:
                        continue
                    
                    _, ext = os.path.splitext(filename)
                    if ext.lower() in ignore_extensions:
                        continue
                    
                    full_path = os.path.join(root, filename)
                    
                    # Evita o próprio arquivo de script e o de saída, se coincidentemente não filtrados antes
                    if os.path.abspath(full_path) == os.path.abspath(output_filepath):
                        continue
                    if os.path.abspath(full_path) == os.path.abspath(__file__):
                        continue

                    if not is_text_file(full_path):
                        continue
                    
                    # Caminho relativo para exibição no txt
                    rel_path = os.path.relpath(full_path, root_path)
                    
                    try:
                        with open(full_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            
                        # Escreve o cabeçalho e conteúdo no formato solicitado
                        header = f"\n{'='*60}\nFILE: {rel_path}\n{'='*60}\n"
                        outfile.write(header)
                        outfile.write(content)
                        outfile.write("\n\n") # Espaço extra entre arquivos
                        
                        print(f"Copiado: {rel_path}")
                        
                    except Exception as e:
                        print(f"Erro ao ler {rel_path}: {e}")

        print(f"\nConcluído! Verifique o arquivo: {output_filename}")

    except Exception as e:
        print(f"Erro fatal: {e}")

if __name__ == "__main__":
    main()
