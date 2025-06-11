// Exemplo de catálogo estático
const links = [
  { nome: "Honk Phill Brasil", url: "http://t.me/+neKcGn4L5Xw2NmIx" },
  { nome: "Defeitos Especiais", url: "http://t.me/+y7LK66DY9ms4NTFh" },
  { nome: "Bostilizando", url: "http://t.me/+Jregy2TuzWoxODcx" }
];

// Adiciona os itens no HTML
const lista = document.getElementById("catalogo");
links.forEach(item => {
  const li = document.createElement("li");
  li.innerHTML = `<a href="${item.url}" target="_blank">${item.nome}</a>`;
  lista.appendChild(li);
});

// API do Telegram WebApp (opcional, para personalizar dentro do app)
if (window.Telegram.WebApp) {
  Telegram.WebApp.expand();
}
