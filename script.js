const BACKEND_URL = "https://cat-logo-backend.onrender.com"; // Altere se necessário
let isAdmin = false;
const loadingScreen = document.getElementById("loading");

function criarCard(canal) {
  const col = document.createElement("div");
  col.className = "col-md-6 mb-4";
  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <img src="${canal.imagem}" class="card-img-top" alt="${canal.nome}">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${canal.nome}</h5>
        <p class="card-text flex-grow-1">${canal.descricao || ""}</p>
        <a href="${canal.link}" target="_blank" class="btn btn-outline-light mt-auto">
          <i class="fab fa-telegram-plane me-1"></i>Acessar
        </a>
        ${isAdmin ? `
          <div class="mt-3 d-flex justify-content-between">
            <button class="btn btn-sm btn-warning me-2 w-50" onclick='abrirModalEdicao(${JSON.stringify(canal)})'>
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-sm btn-danger w-50" onclick='excluirCanal(${canal.id})'>
              <i class="fas fa-trash-alt"></i> Excluir
            </button>
          </div>` : ""}
      </div>
    </div>
  `;
  return col;
}

function renderizarCatalogo(canais) {
  const container = document.getElementById("listaCanais");
  container.innerHTML = "";
  canais.forEach(canal => container.appendChild(criarCard(canal)));
}

async function carregarCanais() {
  loadingScreen.style.display = "flex";
  try {
    const res = await fetch(`${BACKEND_URL}/canais`);
    const canais = await res.json();
    renderizarCatalogo(canais);
  } catch (err) {
    alert("Erro ao carregar canais.");
    console.error(err);
  } finally {
    loadingScreen.style.display = "none";
  }
}

async function verificarAdmin(userId, username) {
  try {
    const res = await fetch(`${BACKEND_URL}/verificar_admin/${userId}`);
    const json = await res.json();
    if (json.admin) {
      isAdmin = true;
      document.getElementById("adminPanel").style.display = "block";
      document.getElementById("adminUsername").textContent = `${username} (ID: ${userId})`;
    }
  } catch (err) {
    console.error("Erro ao verificar admin:", err);
  }
}

async function uploadImagem(file) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.url;
  } catch {
    alert("Erro ao enviar imagem.");
    return null;
  }
}

document.getElementById("formAdicionar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = e.target.nome.value;
  const descricao = e.target.descricao.value;
  const link = e.target.link.value;
  const imagemFile = document.getElementById("imagemInput").files[0];
  let imagemUrl = "";

  if (imagemFile) {
    imagemUrl = await uploadImagem(imagemFile);
    if (!imagemUrl) return;
  }

  await fetch(`${BACKEND_URL}/adicionar_canal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, descricao, link, imagem: imagemUrl }),
  });

  e.target.reset();
  carregarCanais();
});

async function excluirCanal(id) {
  if (!confirm("Deseja excluir este canal?")) return;
  await fetch(`${BACKEND_URL}/excluir_canal/${id}`, { method: "DELETE" });
  carregarCanais();
}

function abrirModalEdicao(canal) {
  const novoNome = prompt("Novo nome:", canal.nome);
  const novoLink = prompt("Novo link:", canal.link);
  const imagemFile = document.getElementById("imagemInput").files[0];

  editarCanal(canal.id, novoNome, novoLink, imagemFile);
}

async function editarCanal(id, nome, link, imagemFile) {
  let body = { nome, link };

  if (imagemFile) {
    const imagemUrl = await uploadImagem(imagemFile);
    if (!imagemUrl) return;
    body.imagem = imagemUrl;
  }

  await fetch(`${BACKEND_URL}/editar_canal/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  carregarCanais();
}

window.addEventListener("load", () => {
  const tg = window.Telegram.WebApp;
  const user = tg?.initDataUnsafe?.user;

  if (!user) {
    alert("Abra dentro do Telegram.");
    return;
  }

  Telegram.WebApp.ready();
  Telegram.WebApp.expand();

  verificarAdmin(user.id, user.username).then(carregarCanais);
});
