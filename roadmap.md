# 🗺️ Project Roadmap : Discord Architecture AI Bot

L'objectif de ce projet est de développer un bot Discord (Node.js / Discord.js) capable de générer l'architecture complète d'un serveur (rôles, permissions, catégories, salons) à partir d'un simple prompt textuel analysé par un LLM via un format pivot (JSON Structure).

## 📌 Jalon 1 : Fondations & Moteur d'Interprétation (No-AI Engine)

*Objectif : Être capable de créer un serveur à partir d'un fichier JSON local.*

* [ ] **1.1 Initialisation du projet**
* Setup de l'environnement Node.js (TypeScript recommandé ou ES Modules).
* Installation des dépendances : `discord.js`, `dotenv`.
* Configuration du bot sur le portail Developer de Discord (Intents requis : `Guilds`, `GuildMessages`).


* [ ] **1.2 Spécification du Schéma JSON (Le Blueprint)**
* Définir le contrat de données strict pour l'architecture d'un serveur.
* *Champs requis :* `serverName`, `roles` (name, color, hoist, permissions), `categories`, `channels` (name, type, topic, parentCategory, permissionOverwrites).


* [ ] **1.3 Développement de l'interpréteur (Core Engine)**
* Écriture de la fonction asynchrone `buildServer(guild, blueprint)`.
* Gestion de l'ordre séquentiel des opérations (indispensable pour les dépendances) :
1. Création des rôles (pour récupérer leurs IDs).
2. Création des catégories.
3. Création des salons (en les liant aux catégories).
4. Application des `permissionOverwrites` en associant les rôles créés à l'étape 1.




* [ ] **1.4 Tests à blanc**
* Création d'un fichier `test-template.json` écrit à la main.
* Exécution du script sur un serveur de test pour valider que l'architecture se déploie proprement sans crash.



---

## 🧠 Jalon 2 : Intégration du LLM & Structured Outputs

*Objectif : Transformer un prompt textuel en notre JSON structuré de manière 100% fiable.*

* [ ] **2.1 Choix et Setup du SDK LLM**
* Installation du SDK (Gemini API, OpenAI, ou client Ollama pour du local).
* Gestion de la clé API via le `.env`.


* [ ] **2.2 Design du System Prompt**
* Rédaction des instructions système pour forcer le modèle à agir comme un traducteur d'architecture Discord.
* Intégration d'exemples de types de salons (ex: `📍-annonces` en lecture seule, `💬-général`).


* [ ] **2.3 Implémentation du mode "Structured Outputs"**
* Utiliser la fonctionnalité native du LLM (comme les Schémas JSON ou le mode JSON strict) pour garantir que le modèle renvoie **exactement** la structure définie au Jalon 1.2, sans blabla textuel autour.


* [ ] **2.4 Pipeline d'Analyse (Parser)**
* Écriture de la fonction `generateBlueprint(userPrompt)`.
* Ajout d'un système de validation de secours (`JSON.parse()` sécurisé avec bloc `try/catch`).



---

## 🤖 Jalon 3 : Interface Discord (Slash Commands)

*Objectif : Rendre l'outil utilisable directement depuis l'application Discord.*

* [ ] **3.1 Handler de Commandes**
* Mettre en place un système de déploiement et d'écoute des Slash Commands (`REST` et `Routes` de Discord).


* [ ] **3.2 Création de la commande `/generate**`
* Argument 1 : `prompt` (string, requis) -> La description du serveur.
* Argument 2 : `clean_mode` (boolean, optionnel) -> Option pour supprimer les salons existants avant de générer la nouvelle structure.


* [ ] **3.3 Gestion de l'UX et du Feedback**
* Utiliser `interaction.deferReply()` car le traitement LLM + la création Discord va dépasser les 3 secondes de timeout de Discord.
* Envoyer un message de statut évolutif (ex: *"Analyse du prompt... 🧠"*, puis *"Création des rôles... 🛡️"*, puis *"Serveur prêt ! 🎉"*).



---

## ⚡ Jalon 4 : Robustesse & Optimisations (Production Ready)

*Objectif : Éviter les crashs liés aux limites de Discord et sécuriser l'application.*

* [ ] **4.1 Gestion du Rate Limiting Discord**
* Implémenter un système de file d'attente (Queue) ou des délais (`setTimeout` / promesses de pause) entre les requêtes de création pour ne pas se faire bannir temporairement par l'API de Discord (surtout lors de la création de 30 salons d'un coup).


* [ ] **4.2 Sécurité et Permissions Bot**
* Ajouter un check d'arborescence : vérifier que le bot a bien le rôle le plus haut et la permission `ADMINISTRATOR` ou `MANAGE_CHANNELS` / `MANAGE_ROLES` avant de lancer la création.
* Restreindre l'utilisation de la commande `/generate` aux seuls administrateurs du serveur.


* [ ] **4.3 Gestion des erreurs (Rollback)**
* Si la création plante au milieu, être capable d'interrompre proprement le script et de logger l'erreur sans laisser le serveur dans un état semi-détruit.



---

## 🚀 Jalon 5 : Fonctionnalités Avancées (Post-MVP)

*Objectif : Aller plus loin dans la personnalisation.*

* [ ] Support des salons textuels, vocaux, mais aussi **Forums** et **Salons d'annonces**.
* [ ] Configuration automatique des messages de bienvenue (via un salon `#bienvenue` géré par le bot).
* [ ] Système de templates pré-enregistrés pour sauter l'étape LLM si l'utilisateur veut un truc classique (Gaming, Études, Communauté).

---

## 📈 Suivi du Dev

> *Légende : ⏳ En attente | 🛠️ En cours | ✅ Terminé*

| Jalon | Fonctionnalité                             | Statut |
| ----- | ------------------------------------------ | ------ |
| **1** | Moteur d'interprétation JSON -> Discord.js | ⏳      |
| **2** | Intégration LLM + Structured JSON Output   | ⏳      |
| **3** | Slash Commands & UX de suivi               | ⏳      |
| **4** | Gestion du Rate Limit & Sécurité           | ⏳      |