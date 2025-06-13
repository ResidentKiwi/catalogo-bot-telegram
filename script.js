const BACKEND_URL = "https://seu-backend.onrender.com"; // ajuste para seu backend correto

const tg = window.Telegram.WebApp;
tg.expand();

const adminPanel = document.getElementById("adminPanel");
const adminInfo = document.getElementById("adminInfo");
const formulario = document.getElementById("formulario");
const catalogo = document.getElementById("catalogo");
const carregando = document.getElementById("carregando");

let isAdmin = false;
let canais = [];
let modoEdicao = false;
let canalEditandoId = null;

// Obtém o user_id do Telegram
const userId = tg.initDataUnsafe?.user?.id || 0;

// Função para verificar se o usuário é admin
async function verificarAdmin(id) {
  try {
    const res = await fetch(`${BACKEND_URL}/admins/${id}`);
    const data = await res.json();
    return data.admin === true;
  } catch (error) {
    console.error("Erro ao verificar admin:", error);
    return false;
  }
}

// Função para carregar canais
async function carregarCanais() {
  try {
    carregando.style.display = "block";
    catalogo.innerHTML = "";
    const res = await fetch(`${BACKEND_URL}/canais`);
    if (!res.ok) throw new Error("Erro ao carregar dados");
    canais = await res.json();

    if (canais.length === 0) {
      catalogo.innerHTML = "<p class='text-center text-muted'>Nenhum canal cadastrado.</p>";
      return;
    }

    canais.forEach((canal) => {
      const card = document.createElement("div");
      card.className = "col-md-4";

      card.innerHTML = `
        <div class="card bg-dark text-white h-100">
          ${canal.imagem ? `<img src="${canal.imagem}" class="card-img-top" alt="${canal.nome}">` : ""}
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${canal.nome}</h5>
            <p class="card-text flex-grow-1">${canal.descricao}</p>
            <a href="${canal.link}" target="_blank" class="btn btn-primary btn-sm">Acessar Canal</a>
            ${isAdmin ? `
              <div class="mt-2 d-flex justify-content-between">
                <button class="btn btn-warning btn-sm btn-editar" data-id="${canal.id}"><i class="fa fa-edit"></i></button>
                <button class="btn btn-danger btn-sm btn-excluir" data-id="${canal.id}"><i class="fa fa-trash"></i></button>
              </div>
            ` : ""}
          </div>
        </div>
      `;
      catalogo.appendChild(card);
    });
  } catch (error) {
    catalogo.innerHTML = `<p class="text-danger text-center">Erro ao carregar dados: ${error.message}</p>`;
  } finally {
    carregando.style.display = "none";
  }
}

// Função para adicionar ou editar canal
async function enviarCanal(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const link = document.getElementById("link").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const imagem = document.getElementById("imagem").value.trim();

  if (!nome || !link || !descricao) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const canalData = {
    nome,
    link,
    descricao,
    imagem: imagem || null,
  };

  try {
    let res;
    if (modoEdicao && canalEditandoId !== null) {
      res = await fetch(`${BACKEND_URL}/canais/${canalEditandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canalData),
      });
    } else {
      res = await fetch(`${BACKEND_URL}/canais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canalData),
      });
    }

    if (!res.ok) throw new Error("Erro ao salvar canal");

    // Limpa o formulário e recarrega canais
    formulario.reset();
    modoEdicao = false;
    canalEditandoId = null;
    formulario.querySelector("button[type='submit']").innerHTML = `<i class="fa fa-plus"></i> Adicionar Canal`;

    await carregarCanais();
  } catch (error) {
    alert(error.message);
  }
}

// Função para preencher formulário para edição
function iniciarEdicao(id) {
  const canal = canais.find((c) => c.id === id);
  if (!canal) return;

  modoEdicao = true;
  canalEditandoId = id;

  document.getElementById("nome").value = canal.nome;
  document.getElementById("link").value = canal.link;
  document.getElementById("descricao").value = canal.descricao;
  document.getElementById("imagem").value = canal.imagem || "";

  formulario.querySelector("button[type='submit']").innerHTML = `<i class="fa fa-save"></i> Salvar Alterações`;
  adminPanel.scrollIntoView({ behavior: "smooth" });
}

// Função para excluir canal
async function excluirCanal(id) {
  if (!confirm("Tem certeza que deseja excluir este canal?")) return;

  try {
    const res = await fetch(`${BACKEND_URL}/canais/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir canal");
    await carregarCanais();
  } catch (error) {
    alert(error.message);
  }
}

// Eventos do formulário e botões dinâmicos
formulario.addEventListener("submit", enviarCanal);
catalogo.addEventListener("click", (event) => {
  if (event.target.closest(".btn-editar")) {
    const id = parseInt(event.target.closest(".btn-editar").dataset.id);
    iniciarEdicao(id);
  }
  if (event.target.closest(".btn-excluir")) {
    const id = parseInt(event.target.closest(".btn-excluir").dataset.id);
    excluirCanal(id);
  }
});

// Inicialização
(async () => {
  isAdmin = await verificarAdmin(userId);
  if (isAdmin) {
    adminPanel.classList.remove("d-none");
    adminInfo.textContent = `Conectado como admin: ${tg.initDataUnsafe.user?.username || "Admin"} (${userId})`;
  }
  await carregarCanais();
})();
