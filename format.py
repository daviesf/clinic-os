import re

status_map = {}
with open('diff_no_lock.txt') as f:
    pass

import subprocess
stat_output = subprocess.check_output(['git', 'diff', '--cached', '--name-status']).decode('utf-8')
for line in stat_output.strip().split('\n'):
    if not line: continue
    parts = line.split('\t')
    if len(parts) == 2:
        status_map[parts[1]] = parts[0]
    elif len(parts) == 3:
        status_map[parts[2]] = parts[0]

stat_lines = subprocess.check_output(['git', 'diff', '--cached', '--stat', '--', ':!*package-lock.json']).decode('utf-8')

file_stats = {}
for line in stat_lines.split('\n'):
    if '|' in line:
        filename = line.split('|')[0].strip()
        changes_str = line.split('|')[1].strip()
        match = re.search(r'(\d+) (insertions?\(\+\)|deletions?\(\-\)|changes?)', changes_str)
        if match:
            parts = changes_str.split(' ')
            count = parts[0]
            file_stats[filename] = count

created = []
modified = []
deleted = []

for f, st in status_map.items():
    if 'package-lock.json' in f: continue
    count = file_stats.get(f, 'desconhecido')
    if st == 'A':
        created.append(f"- `{f}` ({count} linhas): Criação/Adição de módulo/funcionalidade ou documentação.")
    elif st == 'M':
        modified.append(f"- `{f}` ({count} linhas): Refatoração, configurações ou aprimoramento de regras de negócio e segurança.")
    elif st == 'D':
        deleted.append(f"- `{f}` ({count} linhas): Remoção de arquivo obsoleto ou migrações antigas condensadas.")

with open('final_output.md', 'w') as out:
    out.write("1. Arquivos Criados\n")
    out.write("\n".join(created) + "\n\n")
    out.write("2. Arquivos Alterados\n")
    out.write("\n".join(modified) + "\n\n")
    out.write("3. Arquivos Removidos\n")
    out.write("\n".join(deleted) + "\n\n")
    out.write("---\n\n## DIFFS\n\n```diff\n")
    
    with open('diff_no_lock.txt') as df:
        out.write(df.read())
    out.write("\n```\n")
