# 🤖 Discord Architecture AI Bot

<p align="center">
  <img src="https://img.shields.io/badge/node.js-%3E%3D18.0.0-6cc24a?style=flat-for-the-badge&logo=node.js" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-for-the-badge&logo=discord" alt="Discord.js Version" />
  <img src="https://img.shields.io/badge/LLM-Structured_Outputs-orange?style=flat-for-the-badge" alt="LLM Enabled" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-for-the-badge" alt="License" />
</p>

**Discord Architecture AI Bot** est un outil open-source basé sur **Node.js** et **Discord.js** qui automatise entièrement la création et la configuration de serveurs Discord complexes (rôles, catégories, salons, permissions) à partir d'un simple prompt textuel analysé par un LLM.

---

## 💡 Le Concept

Créer un serveur Discord propre, configurer manuellement des dizaines de permissions par rôle, lier les salons aux bonnes catégories... c'est long, répétitif et fastidieux. 

Ce projet résout ce problème en introduisant un **langage intermédiaire (Blueprint JSON)** :
1. 📥 **Input :** L'utilisateur tape une commande `/generate prompt: "Un serveur pour un projet de dev en équipe avec un channel annonces en lecture seule, un forum pour les bugs et des rôles Admin et Dev."`
2. 🧠 **Parsing :** Un LLM analyse le besoin et génère un fichier JSON structuré, validé et standardisé.
3. ⚙️ **Execution :** Le moteur Discord.js interprète ce JSON pour concevoir l'arborescence complète de manière automatisée, séquentielle et sécurisée (en gérant le rate-limiting).

---

## 🛠️ Stack Technique

* **Runtime :** Node.js (v18+)
* **Langage :** JavaScript (ES Modules) / TypeScript
* **Library :** [Discord.js v14](https://discord.js.org/)
* **IA / LLM :** Gemini API / OpenAI API (Utilisation native du mode *Structured Outputs* pour garantir la validité du JSON en sortie du modèle).

---

## ⚙️ Exemple de Spécification Pivot (Blueprint JSON)

C'est ce format strict que le LLM génère et que le bot interprète pour build l'infrastructure :

```json
{
  "serverName": "Projet Fullstack",
  "roles": [
    { "name": "Lead Dev", "color": "#FF5733", "permissions": ["ADMINISTRATOR"] },
    { "name": "Dev", "color": "#33FF57", "permissions": ["VIEW_CHANNEL"] }
  ],
  "categories": [
    {
      "name": "📢 INFOS",
      "channels": [
        { "name": "📍-annonces", "type": "text", "deny": ["@everyone"], "allow": ["Dev", "Lead Dev"] }
      ]
    },
    {
      "name": "💻 DÉVELOPPEMENT",
      "channels": [
        { "name": "💬-général", "type": "text" },
        { "name": "🐛-bug-tracker", "type": "text" }
      ]
    }
  ]
}

```

---

## 📁 Architecture du Projet

```text
├── src/
│   ├── commands/          # Définition et handlers des Slash Commands (ex: /generate)
│   ├── core/
│   │   ├── interpreter.js # Moteur Discord.js (Reçoit le JSON et build l'infrastructure)
│   │   └── llm.js         # Wrapper LLM (Prompt engineering et appel d'API)
│   ├── config/            # Schémas de validation JSON et constantes
│   └── index.js           # Point d'entrée du bot (Initialisation du client Discord)
├── .env.example           # Modèle pour les variables d'environnement (Tokens & Clés API)
├── ROADMAP.md             # Suivi détaillé de l'avancement du projet
└── README.md              # Présentation principale

```

---

## 🚀 Installation & Setup (Local)

### Prerequis

* Node.js v18 ou supérieur
* Un token de bot Discord (via le [Discord Developer Portal](https://www.google.com/search?q=https://discord.com/developers/applications))
* Une clé API LLM (Gemini, OpenAI, etc.)

---

## 🗺️ Roadmap & Évolutions

Le suivi détaillé des jalons de développement (Moteur d'interprétation, Intégration LLM, Gestion du Rate Limit) est disponible dans le fichier roadmap.md

## 🤝 Contribution

Les contributions sont les bienvenues ! Si vous avez des idées pour améliorer le prompt system, ajouter de nouveaux types de salons (Forums, Stages) ou optimiser la vitesse de déploiement, n'hésitez pas à ouvrir une *Issue* ou une *Pull Request*.
