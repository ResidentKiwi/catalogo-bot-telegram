// Recupera dados salvos no localStorage ou usa dados padrão
const canais = JSON.parse(localStorage.getItem("canais")) || [
  {
    nome: "Honk Phill Brasil",
    url: "http://t.me/+neKcGn4L5Xw2NmIx",
    imagem: "./imagens/honk.jpg",
    descricao: "Canal brasileiro sobre Honkai Star Rail e mais!"
  },
  {
    nome: "Defeitos Especiais",
    url: "http://t.me/+y7LK66DY9ms4NTFh",
    imagem: "./imagens/defeitos.jpg",
    descricao: "Conteúdo nonsense, humor e cultura pop."
  },
  {
    nome: "Bostilizando",
    url: "http://t.me/+Jregy2TuzWoxODcx",
    imagem: "./imagens/bostil.jpg",
    descricao: "O melhor (ou pior) do Brasil em forma de memes."
  }
];

// Monta os cards
function renderizarCanais() {
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = ""; // limpa para re-renderizar

  canais.forEach(canal => {
    const col = document.createElement("div");
    col.className = "col-md-4";

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${canal.imagem}" class="card-img-top" alt="${canal.nome}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${canal.nome}</h5>
          <p class="card-text">${canal.descricao}</p>
          <a href="${canal.url}" target="_blank" class="btn btn-outline-primary mt-auto">Acessar canal</a>
        </div>
      </div>
    `;

    catalogo.appendChild(col);
  });
}

// Salva no localStorage
function salvarCanais() {
  localStorage.setItem("canais", JSON.stringify(canais));
}

// Exibe ou oculta o formulário
const btnAdmin = document.getElementById("btnAdmin");
const formAdmin = document.getElementById("formAdmin");

btnAdmin.addEventListener("click", () => {
  formAdmin.style.display = formAdmin.style.display === "none" ? "block" : "none";
});

// Envia novo canal
formAdmin.addEventListener("submit", (e) => {
  e.preventDefault();

  const novoCanal = {
    nome: document.getElementById("nome").value,
    descricao: document.getElementById("descricao").value,
    url: document.getElementById("url").value,
    imagem: document.getElementById("imagem").value || "https://via.placeholder.com/300x180.png?text=Sem+Imagem"
  };

  canais.push(novoCanal);
  salvarCanais();
  renderizarCanais();
  formAdmin.reset();
  formAdmin.style.display = "none";
});

// Renderiza na tela ao carregar
renderizarCanais();

// Telegram WebApp (opcional)
if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.expand();
}
