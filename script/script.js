
let matieres = [];

let modeSuppression = false;

/* On récupère les éléments HTML dont on a besoin.
   document.getElementById("...") = "va chercher l'élément avec cet id". */
const grille              = document.getElementById("grille-matieres");
const carteAjouter        = document.getElementById("carte-ajouter");
const modal               = document.getElementById("modal");
const champNom            = document.getElementById("champ-nom");
const champNote           = document.getElementById("champ-note");
const champCoef           = document.getElementById("champ-coef");
const messageErreur       = document.getElementById("message-erreur");
const btnValider          = document.getElementById("btn-valider");
const btnAnnuler          = document.getElementById("btn-annuler");
const btnModeSuppression  = document.getElementById("btn-mode-suppression");
const btnSupprimerSelection = document.getElementById("btn-supprimer-selection");

/* Éléments de la barre de résumé */
const resumeMoyenne       = document.getElementById("resume-moyenne");
const resumeMention       = document.getElementById("resume-mention");
const resumePoints        = document.getElementById("resume-points");
const resumeCoefficients  = document.getElementById("resume-coefficients");

/* Une petite liste d'émojis pour donner une icône à chaque matière.
   On en choisit un au hasard quand on crée une carte. */
const emojis = ["📘", "📗", "📕", "📙", "🧪", "🔬", "🧮", "💻", "🌍", "🎨", "🎵", "⚗️"];


/* ---------- 2. SAUVEGARDE (localStorage) ---------- */

/* localStorage garde des données dans le navigateur, même après
   avoir fermé la page. Mais il ne stocke que du TEXTE.
   -> on transforme notre tableau en texte avec JSON.stringify. */
function sauvegarder() {
  localStorage.setItem("matieres", JSON.stringify(matieres));
}

/* Au démarrage, on relit ce texte et on le retransforme en
   tableau avec JSON.parse. */
function charger() {
  const donnees = localStorage.getItem("matieres");
  if (donnees) {
    matieres = JSON.parse(donnees);
  }
}


/* ---------- 3. AFFICHAGE DES CARTES ---------- */

/* Cette fonction redessine TOUTES les cartes à partir du
   tableau "matieres". On l'appelle à chaque changement. */
function afficherMatieres() {

  /* a) On efface toutes les anciennes cartes de matières.
        On garde uniquement la carte "Ajouter". */
  const anciennesCartes = document.querySelectorAll(".carte-matiere");
  anciennesCartes.forEach(function (carte) {
    carte.remove();
  });

  /* b) On recrée une carte pour chaque matière du tableau.
        "index" est la position de la matière (0, 1, 2...). */
  matieres.forEach(function (matiere, index) {

    /* Calcul des points de la matière = note × coefficient */
    const points = matiere.note * matiere.coefficient;

    /* Est-ce que la matière est réussie ? (note >= 10) */
    const estAdmis = matiere.note >= 10;

    /* On crée une nouvelle carte (une <div>) */
    const carte = document.createElement("div");
    carte.className = "carte carte-matiere";

    /* On mémorise l'index dans la carte, utile pour la suppression */
    carte.dataset.index = index;

    /* On remplit l'intérieur de la carte avec du HTML.
       Les ${...} insèrent nos valeurs dans le texte. */
    carte.innerHTML = `
      <div class="carte-haut">
        <span class="carte-icone">${matiere.emoji}</span>
        <span class="carte-nom">${matiere.nom}</span>
      </div>

      <div class="carte-ligne">Note <strong>${matiere.note} / 20</strong></div>
      <div class="carte-ligne">Coefficient <strong>${matiere.coefficient}</strong></div>

      <div class="carte-points">Points : ${points.toFixed(2)}</div>

      <span class="badge ${estAdmis ? "badge-admis" : "badge-ajourne"}">
        ${estAdmis ? "Admis" : "Ajourné"}
      </span>
    `;

    /* Quand on clique sur la carte : utile SEULEMENT en mode suppression.
       On ajoute/enlève la classe "selectionnee". */
    carte.addEventListener("click", function () {
      if (modeSuppression) {
        carte.classList.toggle("selectionnee");
      }
    });

    /* On insère la carte AVANT la carte "Ajouter",
       pour que "Ajouter" reste toujours à la fin. */
    grille.insertBefore(carte, carteAjouter);
  });

  /* c) On met à jour les statistiques globales */
  mettreAJourResume();

  /* d) On sauvegarde l'état actuel */
  sauvegarder();
}


/* ---------- 4. CALCULS ---------- */

/* Met à jour la barre de résumé (moyenne, mention, totaux). */
function mettreAJourResume() {

  let totalPoints = 0;        /* somme des (note × coef) */
  let totalCoefficients = 0;  /* somme des coefficients */

  /* On additionne pour chaque matière */
  matieres.forEach(function (matiere) {
    totalPoints += matiere.note * matiere.coefficient;
    totalCoefficients += matiere.coefficient;
  });

  /* Moyenne pondérée = total des points ÷ total des coefficients.
     Attention : on ne divise pas par 0 s'il n'y a aucune matière. */
  let moyenne = 0;
  if (totalCoefficients > 0) {
    moyenne = totalPoints / totalCoefficients;
  }

  /* On affiche les valeurs. toFixed(2) = 2 chiffres après la virgule. */
  resumeMoyenne.textContent = moyenne.toFixed(2) + " / 20";
  resumePoints.textContent = totalPoints.toFixed(2);
  resumeCoefficients.textContent = totalCoefficients;

  /* On affiche le résultat (Admis/Ajourné + mention) */
  resumeMention.textContent = obtenirMention(moyenne, totalCoefficients);
}

/* Renvoie un texte selon la moyenne (le fameux "Admis / Ajourné"). */
function obtenirMention(moyenne, totalCoefficients) {
  if (totalCoefficients === 0) return "—";            /* aucune matière */
  if (moyenne < 10)  return "Ajourné";
  if (moyenne < 12)  return "Admis – Passable";
  if (moyenne < 14)  return "Admis – Assez Bien";
  if (moyenne < 16)  return "Admis – Bien";
  return "Admis – Très Bien";
}


/* ---------- 5. AJOUTER UNE MATIÈRE ---------- */

/* Ouvre la fenêtre modale */
function ouvrirModal() {
  modal.classList.remove("cache");
  messageErreur.classList.add("cache");
  champNom.value = "";   /* on vide les champs */
  champNote.value = "";
  champCoef.value = "";
  champNom.focus();      /* le curseur va dans le premier champ */
}

/* Ferme la fenêtre modale */
function fermerModal() {
  modal.classList.add("cache");
}

/* Vérifie les champs puis ajoute la matière au tableau */
function validerAjout() {

  /* On récupère ce que l'utilisateur a tapé.
     .trim() enlève les espaces inutiles. */
  const nom = champNom.value.trim();
  const note = parseFloat(champNote.value);        /* texte -> nombre */
  const coefficient = parseInt(champCoef.value);   /* texte -> nombre entier */

  /* --- Vérifications simples --- */
  if (nom === "") {
    afficherErreur("Le nom de la matière est obligatoire.");
    return; /* on arrête la fonction ici */
  }
  /* isNaN = "is Not a Number" (n'est pas un nombre) */
  if (isNaN(note) || note < 0 || note > 20) {
    afficherErreur("La note doit être un nombre entre 0 et 20.");
    return;
  }
  if (isNaN(coefficient) || coefficient < 1) {
    afficherErreur("Le coefficient doit être un nombre supérieur ou égal à 1.");
    return;
  }

  /* Tout est bon : on crée l'objet matière et on l'ajoute au tableau */
  const nouvelleMatiere = {
    nom: nom,
    note: note,
    coefficient: coefficient,
    /* On choisit un émoji au hasard dans notre liste */
    emoji: emojis[Math.floor(Math.random() * emojis.length)]
  };

  matieres.push(nouvelleMatiere); /* push = ajouter à la fin du tableau */

  afficherMatieres(); /* on redessine tout */
  fermerModal();      /* on ferme la fenêtre */
}

/* Affiche un message d'erreur dans la modale */
function afficherErreur(texte) {
  messageErreur.textContent = texte;
  messageErreur.classList.remove("cache");
}


/* ---------- 6. MODE SUPPRESSION ---------- */

/* Active ou désactive le mode suppression */
function basculerModeSuppression() {
  modeSuppression = !modeSuppression; /* inverse vrai <-> faux */

  /* On ajoute/enlève une classe sur le <body>.
     Le CSS s'occupe de changer l'apparence des cartes. */
  document.body.classList.toggle("mode-suppression", modeSuppression);

  if (modeSuppression) {
    /* Mode activé : on change le texte et on montre le bouton "Supprimer" */
    btnModeSuppression.textContent = "✖️ Quitter le mode suppression";
    btnSupprimerSelection.classList.remove("cache");
  } else {
    /* Mode désactivé : on remet tout comme avant */
    btnModeSuppression.textContent = "🗑️ Mode suppression";
    btnSupprimerSelection.classList.add("cache");

    /* On enlève la sélection de toutes les cartes */
    document.querySelectorAll(".selectionnee").forEach(function (carte) {
      carte.classList.remove("selectionnee");
    });
  }
}

/* Supprime toutes les cartes sélectionnées */
function supprimerSelection() {

  /* On récupère toutes les cartes marquées "selectionnee" */
  const cartesSelectionnees = document.querySelectorAll(".selectionnee");

  if (cartesSelectionnees.length === 0) {
    alert("Aucune matière sélectionnée. Cliquez d'abord sur des cartes.");
    return;
  }

  /* On récupère les positions (index) à supprimer.
     On les trie du plus GRAND au plus petit : c'est important pour
     ne pas décaler les autres index pendant la suppression. */
  const indexASupprimer = [];
  cartesSelectionnees.forEach(function (carte) {
    indexASupprimer.push(Number(carte.dataset.index));
  });
  indexASupprimer.sort(function (a, b) { return b - a; });

  /* On enlève chaque matière du tableau.
     splice(position, 1) = enlève 1 élément à cette position. */
  indexASupprimer.forEach(function (index) {
    matieres.splice(index, 1);
  });

  afficherMatieres(); /* on redessine la grille mise à jour */
}


/* ---------- 7. DÉMARRAGE DE L'APPLICATION ---------- */

/* On connecte les boutons à leurs fonctions.
   "addEventListener('click', ...)" = "quand on clique, fais ceci". */
carteAjouter.addEventListener("click", ouvrirModal);
btnValider.addEventListener("click", validerAjout);
btnAnnuler.addEventListener("click", fermerModal);
btnModeSuppression.addEventListener("click", basculerModeSuppression);
btnSupprimerSelection.addEventListener("click", supprimerSelection);

/* Bonus pratique : on peut fermer la modale en cliquant sur le
   fond sombre (mais pas sur la fenêtre blanche elle-même). */
modal.addEventListener("click", function (evenement) {
  if (evenement.target === modal) {
    fermerModal();
  }
});

/* On charge les données sauvegardées, puis on affiche tout.
   Ces deux lignes sont le VRAI démarrage du programme. */
charger();
afficherMatieres();
