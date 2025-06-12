// URL do seu backend no Render
const BACKEND_URL = "https://cat-logo-backend.onrender.com";

// Renderiza os canais no catálogo
function renderizarCatalogo(canais) {
  const container = document.getElementById("catalogo");
  container.innerHTML = "";

  canais.forEach(canal => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";

    col.innerHTML = `
      <div class="card shadow-sm h-100">
        <img src="${canal.imagem}" class="card-img-top" alt="${canal.nome}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${canal.nome}</h5>
          <p class="card-text flex-grow-1">${canal.descricao}</p>
          <a href="${canal.url}" target="_blank" class="btn btn-primary mt-auto">🔗 Acessar Canal</a>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

// Carrega os canais do backend
async function carregarCanais() {
  try {
    const response = await fetch(`${BACKEND_URL}/canais`);
    const canais = await response.json();
    renderizarCatalogo(canais);
  } catch (error) {
    console.error("Erro ao carregar canais:", error);
  }
}

// Verifica se o usuário é admin
async function verificarAdmin(id) {
  const numericId = Number(id);
  if (isNaN(numericId)) {
    console.error("ID inválido:", id);
    return false;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/admins/${numericId}`);
    const json = await response.json();
    console.log("Dados do admin:", json);
    return json.admin === true;
  } catch (error) {
    alert("Erro ao verificar admin.");
    console.error("Erro ao verificar admin:", error);
    return false;
  }
}

// Adiciona novo canal via backend
async function adicionarCanal(event) {
  event.preventDefault();

  const canal = {
    nome: document.getElementById("nome").value,
    descricao: document.getElementById("descricao").value,
    url: document.getElementById("url").value,
    imagem: document.getElementById("imagem").value,
  };

  try {
    const response = await fetch(`${BACKEND_URL}/canais`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(canal),
    });

    if (!response.ok) {
      throw new Error("Erro ao adicionar canal.");
    }

    document.getElementById("canalForm").reset();
    carregarCanais();
  } catch (error) {
    alert("Erro ao adicionar canal.");
    console.error(error);
  }
}

// Inicializa tudo corretamente
window.onload = async () => {
  if (!window.Telegram?.WebApp?.initDataUnsafe) {
    alert("Esta aplicação precisa ser executada dentro do Telegram.");
    console.error("Telegram WebApp não disponível.");
    return;
  }

  Telegram.WebApp.ready();
  Telegram.WebApp.expand();

  const telegramUser = Telegram.WebApp.initDataUnsafe.user;
  if (!telegramUser?.id) {
    alert("Não foi possível identificar seu usuário Telegram.");
    console.error("User Telegram inválido:", telegramUser);
    return;
  }

  const userId = telegramUser.id;
  console.log("✅ ID do usuário Telegram:", userId);

  if (await verificarAdmin(userId)) {
    document.getElementById("adminPanel").classList.remove("d-none");
    document.getElementById("canalForm").addEventListener("submit", adicionarCanal);
  }

  carregarCanais();
};
