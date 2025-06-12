const BACKEND_URL = "https://cat-logo-backend.onrender.com";
let isAdmin = false;

function mostrarCarregando(mostrar) {
  const loader = document.getElementById("loading");
  loader.style.display = mostrar ? "flex" : "none";
}

function criarCard(canal) {
  const col = document.createElement("div");
  col.className = "col-md-4 mb-4";
  col.innerHTML = `
    <div class="card h-100 shadow-sm bg-dark text-light border-secondary">
      <img src="${canal.imagem}" class="card-img-top" alt="${canal.nome}" style="max-height: 200px; object-fit: cover;">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title text-white">${canal.nome}</h5>
        <p class="card-text flex-grow-1">${canal.descricao}</p>
        <a href="${canal.url}" target="_blank" class="btn btn-outline-light mt-auto">
          <i class="fas fa-link me-1"></i>Acessar Canal
        </a>
        ${isAdmin ? `
          <div class="mt-2 d-flex justify-content-between">
            <button class="btn btn-sm btn-outline-secondary" onclick='abrirModalEdicao(${JSON.stringify(canal)})'>
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick='excluirCanal(${canal.id})'>
              <i class="fas fa-trash"></i>
            </button>
          </div>
        ` : ""}
      </div>
    </div>
  `;
  return col;
}

function renderizarCatalogo(canais) {
  const container = document.getElementById("catalogo");
  container.innerHTML = "";
  canais.forEach(canal => container.appendChild(criarCard(canal)));
}

async function carregarCanais() {
  mostrarCarregando(true);
  try {
    const res = await fetch(`${BACKEND_URL}/canais`);
    const canais = await res.json();
    renderizarCatalogo(canais);
  } catch (error) {
    alert("Erro ao carregar canais.");
  }
  mostrarCarregando(false);
}

async function verificarAdmin(id) {
  const res = await fetch(`${BACKEND_URL}/admins/${id}`);
  const json = await res.json();
  return json.admin === true;
}

async function uploadImagem(arquivo) {
  const formData = new FormData();
  formData.append("file", arquivo);
  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  return json.url;
}

async function adicionarCanal(event) {
  event.preventDefault();
  const nome = document.getElementById("nome").value;
  const descricao = document.getElementById("descricao").value;
  const url = document.getElementById("url").value;
  const imagemArquivo = document.getElementById("imagemArquivo").files[0];

  const imagemURL = await uploadImagem(imagemArquivo);
  const canal = { nome, descricao, url, imagem: imagemURL };

  await fetch(`${BACKEND_URL}/canais`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(canal),
  });

  document.getElementById("canalForm").reset();
  carregarCanais();
}

function abrirModalEdicao(canal) {
  document.getElementById("editId").value = canal.id;
  document.getElementById("editNome").value = canal.nome;
  document.getElementById("editDescricao").value = canal.descricao;
  document.getElementById("editUrl").value = canal.url;
  document.getElementById("editImagemArquivo").value = "";
  new bootstrap.Modal(document.getElementById("editarModal")).show();
}

async function editarCanal(event) {
  event.preventDefault();
  const id = document.getElementById("editId").value;
  const nome = document.getElementById("editNome").value;
  const descricao = document.getElementById("editDescricao").value;
  const url = document.getElementById("editUrl").value;
  const imagemArquivo = document.getElementById("editImagemArquivo").files[0];

  let imagemURL = null;
  if (imagemArquivo) {
    imagemURL = await uploadImagem(imagemArquivo);
  }

  const body = { nome, descricao, url };
  if (imagemURL) body.imagem = imagemURL;

  await fetch(`${BACKEND_URL}/canais/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  bootstrap.Modal.getInstance(document.getElementById("editarModal")).hide();
  carregarCanais();
}

async function excluirCanal(id) {
  if (!confirm("Deseja mesmo excluir este canal?")) return;
  await fetch(`${BACKEND_URL}/canais/${id}`, { method: "DELETE" });
  carregarCanais();
}

window.onload = async () => {
  if (!window.Telegram?.WebApp?.initDataUnsafe) {
    alert("Execute dentro do Telegram.");
    return;
  }

  Telegram.WebApp.ready();
  Telegram.WebApp.expand();

  const user = Telegram.WebApp.initDataUnsafe.user;
  const userId = user?.id;
  const username = user?.username || "Desconhecido";

  isAdmin = await verificarAdmin(userId);

  if (isAdmin) {
    document.getElementById("adminPanel").classList.remove("d-none");
    document.getElementById("adminUsername").textContent = username;
    document.getElementById("adminUserId").textContent = userId;
    document.getElementById("canalForm").addEventListener("submit", adicionarCanal);
    document.getElementById("editarForm").addEventListener("submit", editarCanal);
  }

  carregarCanais();
};
