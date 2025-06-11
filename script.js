// Dados dos canais
const canais = [
  {
    nome: "Honk Phill Brasil",
    url: "http://t.me/+neKcGn4L5Xw2NmIx",
    imagem: "https://via.placeholder.com/300x180.png?text=Honk+Phill+Brasil",
    descricao: "Canal brasileiro sobre Honkai Star Rail e mais!"
  },
  {
    nome: "Defeitos Especiais",
    url: "http://t.me/+y7LK66DY9ms4NTFh",
    imagem: "https://via.placeholder.com/300x180.png?text=Defeitos+Especiais",
    descricao: "Conteúdo nonsense, humor e cultura pop."
  },
  {
    nome: "Bostilizando",
    url: "http://t.me/+Jregy2TuzWoxODcx",
    imagem: "https://via.placeholder.com/300x180.png?text=Bostilizando",
    descricao: "O melhor (ou pior) do Brasil em forma de memes."
  }
];

// Monta os cards no HTML
const catalogo = document.getElementById("catalogo");

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

// Telegram WebApp API (opcional)
if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.expand();
}
