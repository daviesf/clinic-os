const API_URL = 'http://localhost:3000';
let token = '';

async function fetchApi(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {})
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
  return { status: res.status, data };
}

async function run() {
  try {
    console.log("1. Tentando registrar a@a.com com senha 123456...");
    let regRes;
    try {
        regRes = await fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email: "a@a.com",
            password: "123456",
            clinicName: "Clínica Vida Saúde",
            specialty: "Geral"
        })
        });
        token = regRes.data.accessToken;
        console.log("Usuário criado com sucesso!");
    } catch (e) {
        if (e.status === 400 || e.status === 409 || (e.data && e.data.error === "Email already in use")) {
            console.log("Usuário já existe. Realizando login...");
            const loginRes = await fetchApi('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: "a@a.com",
                    password: "123456"
                })
            });
            token = loginRes.data.accessToken;
        } else {
            throw e;
        }
    }

    console.log("2. Populando Pacientes...");
    const patients = [
        { name: "Maria Oliveira", phone: "11988887777" },
        { name: "Carlos Pereira", phone: "11977776666" },
        { name: "Ana Clara Souza", phone: "11966665555" },
        { name: "Roberto Santos", phone: "11955554444" },
        { name: "Fernanda Costa", phone: "11944443333" }
    ];
    
    const patientIds = [];
    for (const p of patients) {
        const ptRes = await fetchApi('/api/patients', {
            method: 'POST',
            body: JSON.stringify(p)
        });
        patientIds.push(ptRes.data.data.id);
        console.log(`Paciente ${p.name} criado.`);
    }

    console.log("3. Populando Agendamentos...");
    for (let i = 0; i < patients.length; i++) {
        // distribute appointments across different dates
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(14, 0, 0, 0);

        await fetchApi('/api/appointments', {
            method: 'POST',
            body: JSON.stringify({
                patientName: patients[i].name,
                phone: patients[i].phone,
                date: date.toISOString(),
                status: i % 2 === 0 ? "SCHEDULED" : "COMPLETED",
                patientId: patientIds[i]
            })
        });
    }

    console.log("4. Populando Tarefas (Tasks)...");
    await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: "Revisar exames da Maria", status: "PENDING", priority: "HIGH", patientId: patientIds[0] })
    });
    await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: "Ligar para confirmar consulta do Carlos", status: "COMPLETED", priority: "MEDIUM", patientId: patientIds[1] })
    });
    await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: "Solicitar feedback da Ana", status: "PENDING", priority: "LOW", patientId: patientIds[2] })
    });

    console.log("5. Populando Base de Conhecimento...");
    await fetchApi('/api/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title: "Horário de Funcionamento", content: "A clínica funciona de segunda a sexta, das 08:00 às 18:00." })
    });
    await fetchApi('/api/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title: "Preços", content: "A consulta particular custa R$ 350,00. Retorno em até 15 dias é gratuito." })
    });

    console.log("=== POPULAÇÃO CONCLUÍDA ===");
  } catch (error) {
    console.error("Erro ao popular:");
    console.error(error);
  }
}

run();
