/* =========================
1. SELECTION DES ELEMENTS
===========================*/
const champRecherche = document.querySelector("#champ-recherche");
const btnAleatoire = document.querySelector("#btn-aleatoire");
const resultats = document.querySelector("#resultats");

const API_URL = "https://www.themealdb.com/api/json/v1/1";

/* ===========================
   2. FONCTIONS D'AFFICHAGE
   =========================== */

// Affiche un message (chargement, ereur, aucun resultat)
function afficherMessage(texte, classe) {
    resultats.innerHTML = `<p class="${classe}">${texte}</p>`;
}

// Affiche une liste de recettes
function afficherRecettes(recettes) {
    // Cas 1: aucune recette
    if (!recettes || recettes.length === 0) {
        afficherMessage("Aucune recette trouvée 😕", "aucun resultat");
        return;
    }

    // Cas 2: on a des recettes -> on construit les cartes
    resultats.innerHTML = "";

    recettes.forEach(function(recette) {
        const carte = document.createElement("article");
        carte.className = "recette";
        carte.dataset.id = recette.idMeal;  // <- On stoke l'ID
        carte.innerHTML = `
            <img src="${recette.strMealThumb}" alt="${recette.strMeal}" loading="lazy">
            <div class="recette-contenu">
                <h3>${recette.strMeal}</h3>
                <p class="meta">🌍 ${recette.strArea || "International"}</p>
                <p class="categorie">🍽️ ${recette.strCategorie || "Divers"}</p>
            </div>
        `;

        // Ecoute du clic sur la carte
        carte.addEventListener("click", function() {
            afficherDetailRecette(recette.idMeal);
        });
        resultats.appendChild(carte);
    });
}

async function afficherDetailRecette(id) {
    // Afficher le modal tout de suite avec un message de chargement
    ouvrirModal(`
        <div class="modal-corps">
            <!--<p>Chargement...</p>-->
            <div class="spinner"></div>
        </div>
    `);

    try {
        const reponse = await fetch(`${API_URL}/lookup.php?i=${id}`);

        if (!reponse.ok) {
            throw new Error("Erreur HTTP " + reponse.status);
        }

        const data = await reponse.json();
        const recette = data.meals[0];

        // Construire le contenu du modal
        const contenu = construireContenuModal(recette);
        ouvrirModal(contenu);

    } catch (erreur) {
        console.error("Erreur :", erreur);
        ouvrirModal(`
            <div class="modal-corps">
                <p class="erreur">❌ Impossible de charger la recette.</p>
            </div>
        `);
    }
}

function construireContenuModal(recette) {
    // 1. Extraire les ingrédients (format bizarre de TheMealDB)
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = recette["strIngredient" + i];
        const mesure = recette["strMeasure" + i];

        // Si l'ingrédient existe et n'est ps vide
        if (ingredient && ingredient.trim() !== "") {
            ingredients.push({
                nom: ingredient,
                quantite: mesure ? mesure.trim() : ""
            });
        }
    }

    // 2. Contruire la liste des ingrédients en HTML
    const listeIngredients = ingredients
        .map(ing => `
            <li>
                <span>${ing.nom}</span>
                <span class="quantite">${ing.quantite}</span>
            </li>
        `)
        .join("");

    // 3. Construire la vidéo YouTube si elle existe
    let videoHTML = "";
    if (recette.strYoutube) {
        // Transformer https://www.youtube.com/watch?v=XXX en embed
        const videoId = recette.strYoutube.split("v=")[1];
        videoHTML = `
            <h3>Vidéo</h3>
            <div class="modal-video">
                <iframe
                    width="100%"
                    height="315"
                    src="https://www.youtube.com/embed/${videoId}"
                    frameborder="0"
                    allowfullscreen>
                </iframe>
            </div>
        `;
    }

    // 4. Retourner le HTML complet
    return `
        <img class="modal-image" src="${recette.strMealThumb}" alt="${recette.strMeal}">
        <div class="modal-corps">
            <h2>${recette.strMeal}</h2>
            <p class="modal-meta">
                🌍 ${recette.strArea || "International"} ·
                🍽️ ${recette.strCategory || "Divers"}
            </p>
            
            <h3>Ingrédients</h3>
            <ul class="ingredients">
                ${listeIngredients}
            </ul>
            
            <h3>Instructions</h3>
            <p class="instructions">${recette.strInstructions}</p>
            
            ${videoHTML}
        </div>
    `;
}

// Sélection
const modal = document.querySelector("#modal");
const modalCorps = document.querySelector("#modal-corps");
const btnFermer = document.querySelector("#modal-fermer");

// Ouvrir le modal
function ouvrirModal(contenu) {
    modalCorps.innerHTML = contenu;
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Empèche le scroll de la page derrière
}

// Fermer le modal
function fermerModal() {
    modal.classList.remove("active");
    document.body.style.overflow = ""; // Rétablit le scroll
}

// Ecoute du clic sur le bouton fermer
btnFermer.addEventListener("click", fermerModal);

// Ecoute du clic sur l'overlay (en dehors du modal)
modal.addEventListener("click", function(event) {
    if (event.target === modal) { // Seulement si on clique sur l'overlay, pas sur le contenu
        fermerModal();
    }
});

// Ecoute de la touche Echap
document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fermerModal();
    }
});

/* ================================
   3. REQUÊTTES A L'API
   ================================ */

// Recherche pa mot clé
async function chercherRecettes(terme) {
    afficherMessage("Chargement...", "chargement");

    try {
        const reponse = await fetch(`${API_URL}/search.php?s=${encodeURIComponent(terme)}`);

        if(!reponse.ok) {
            throw new Error("Erreur HTTP " + reponse.status);
        }

        const data = await reponse.json();
        afficherRecettes(data.meals);

    } catch (erreur) {
        console.error("Erreur :", erreur);
        afficherMessage("❌ Impossible de charger les recettes.", "erreur");
    }
}

// Recette aléatoire
async function chargerRecetteAleatoire() {
    afficherMessage("Chargement...", "chargement");

    try {
        const reponse = await fetch(`${API_URL}/random.php`);

        if (!reponse.ok) {
            throw new Error("Erreur HTTP " + reponse.status);
        }

        const data = await reponse.json();
        afficherRecettes(data.meals);


    } catch (erreur) {
        console.error("Erreur :", erreur);
        afficherMessage("❌ Impossible de charger la recette.", "erreur");
    }
}

/* ==================================
   4. EVENEMENTS
   ================================== */

// Recherche à la frappe (avec délai anti-spam)
let timer;
champRecherche.addEventListener("input", function() {
    clearTimeout(timer);
    const terme = champRecherche.value.trim();

    if (terme.length === 0) {
        afficherMessage("Tapez un mot-clé pour chercher une recette 🔍", "aucun-resultat");
        return;
    }

    timer = setTimeout(function() {
        chercherRecettes(terme);
    }, 500); // Attend 500ms après la dernière frappe
});

// Bouton "Au hazard"
btnAleatoire.addEventListener("click", chargerRecetteAleatoire);

/* ===============================
   5. CHARGEMENT INITIAL
   =============================== */
chercherRecettes("crepes");

function fermerModal() {
    modal.classList.add("fermeture");
    setTimeout(function() {
        modal.classList.remove("active", "fermeture");
        document.body.style.overflow = "";
    }, 200);
}

carte.addEventListener("mouseenter", function() {
    // Précharger la recette (mise en cache navigateur)
    fetch(`${API_URL}/lookup.php?i=${recette.idMeal}`);
});