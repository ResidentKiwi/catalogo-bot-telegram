const BACKEND_URL = "https://cat-logo-backend.onrender.com/"; // Sem barra duplicada

let isAdmin = false;
let loadingScreen;

function criarCard(canal) {
  const col = document.createElement("div");
  col.className = "col-md-4 mb-4";

  const card = document.createElement("div");
  card.className = "card h-100 shadow-sm";

  const img = document.createElement("img");
  img.src = canal.imagem;
  img.className = "card-img-top";
  img.alt = canal.nome;

  const cardBody = document.createElement("div");
  cardBody.className = "card-body d-flex flex-column";

  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = canal.nome;

  const desc = document.createElement("p");
  desc.className = "card-text flex-grow-1";
  desc.textContent = canal.descricao || "";

  const linkBtn = document.createElement("a");
  linkBtn.href = canal.link || canal.url;
  linkBtn.target = "_blank";
  linkBtn.className = "btn btn-outline-light mt-auto";
  linkBtn.innerHTML = `<i class="fas fa-link me-1"></i> Acessar Canal`;

  cardBody.appendChild(title);
  cardBody.appendChild(desc);
  cardBody.appendChild(linkBtn);

  if (isAdmin) {
    const btnGroup = document.createElement("div");
    btnGroup.className = "mt-2 d-flex justify-content-between";

    const editarBtn = document.createElement("button");
    editarBtn.className = "btn btn-sm btn-outline-secondary";
    editarBtn.innerHTML = `<i class="fas fa-pen"></i>`;
    editarBtn.addEventListener("click", () => abrirModalEdicao(canal));

    const excluirBtn = document.createElement("button");
    excluirBtn.className = "btn btn-sm btn-outline-danger";
    excluirBtn.innerHTML = `<i class="fas fa-trash"></i>`;
    excluirBtn.addEventListener("click", () => excluirCanal(canal.id));

    btnGroup.appendChild(editarBtn);
    btnGroup.appendChild(excluirBtn);
    cardBody.appendChild(btnGroup);
  }

  card.appendChild(img);
  card.appendChild(cardBody);
  col.appendChild(card);

  return col;
}

function renderizarCatalogo(canais) {
  const container = document.getElementById("catalogo");
  container.innerHTML = "";
  canais.forEach(canal => container.appendChild(criarCard(canal)));
}

async function carregarCanais() {
  try {
    const res = await fetch(`${BACKEND_URL}canais`);
    if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
    const canais = await res.json();
    renderizarCatalogo(canais);
  } catch (err) {
    console.error("Erro ao carregar canais:", err);
    document.getElementById("erro").classList.remove("d-none");
    document.getElementById("detalhesErro").textContent = err.message;
  } finally {
    loadingScreen.style.display = "none";
  }
}

async function verificarAdmin(id) {
  try {
    const res = await fetch(`${BACKEND_URL}admins/${id}`);
    const json = await res.json();
    return json.admin === true;
  } catch (err) {
    console.error("Erro ao verificar admin:", err);
    return false;
  }
}

async function uploadImagem(arquivo) {
  const formData = new FormData();
  formData.append("file", arquivo);
  const res = await fetch(`${BACKEND_URL}upload`, {
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
  const link = document.getElementById("url").value;
  const imagemArquivo = document.getElementById("imagemArquivo").files[0];
  let imagemURL = "";

  if (imagemArquivo) {
    imagemURL = await uploadImagem(imagemArquivo);
  }

  await fetch(`${BACKEND_URL}canais`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, descricao, url: link, imagem: imagemURL }),
  });

  document.getElementById("canalForm").reset();
  carregarCanais();
}

function abrirModalEdicao(canal) {
  document.getElementById("editId").value = canal.id;
  document.getElementById("editNome").value = canal.nome;
  document.getElementById("editDescricao").value = canal.descricao;
  document.getElementById("editUrl").value = canal.link || canal.url;
  new bootstrap.Modal(document.getElementById("editarModal")).show();
}

async function editarCanal(event) {
  event.preventDefault();
  const id = document.getElementById("editId").value;
  const nome = document.getElementById("editNome").value;
  const descricao = document.getElementById("editDescricao").value;
  const link = document.getElementById("editUrl").value;
  const imagemArquivo = document.getElementById("editImagemArquivo").files[0];
  let body = { nome, descricao, url: link };

  if (imagemArquivo) {
    const imagemURL = await uploadImagem(imagemArquivo);
    body.imagem = imagemURL;
  }

  await fetch(`${BACKEND_URL}canais/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  bootstrap.Modal.getInstance(document.getElementById("editarModal")).hide();
  carregarCanais();
}

async function excluirCanal(id) {
  if (!confirm("Deseja mesmo excluir este canal?")) return;
  await fetch(`${BACKEND_URL}canais/${id}`, { method: "DELETE" });
  carregarCanais();
}

window.onload = async () => {
  loadingScreen = document.getElementById("loading");

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

  await carregarCanais();
};

// Botão de tentar novamente
document.getElementById("tentarNovamente").addEventListener("click", () => {
  document.getElementById("erro").classList.add("d-none");
  loadingScreen.style.display = "flex";
  carregarCanais();
});
