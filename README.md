# <div align="center">Steam Free Games Lists Tools</div>

## 🔍 About
This tool searches for **free** games on Steam that have **achievements** and **Steam trading cards**.

---

## 🛠️ Features
- Finds free games with **achievements** ✅
- Finds free games with **Steam trading cards** 🎴
- Saves results to text files 📂
- Automatically updates the repository with new findings 🔄

---

## 📌 Requirements
- [Node.js](https://nodejs.org/en/) (latest LTS recommended)

---

## 📥 Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/ohsyme/steam-free-games-list.git
cd steam-free-games-list
```

### 2️⃣ Install Dependencies
```sh
npm install
```

---

## 🚀 Usage
### Run the script
#### Regular Node.js:
```sh
node index.js
```

#### Using PM2 (Recommended for long-term execution):
```sh
pm install -g pm2
pm start
pm2 monit
```

---

## 📁 Output Files
- **`free_games_with_achievements.txt`** → Contains free games with achievements.
- **`free_games_with_cards.txt`** → Contains free games with trading cards.
- **`progress.json`** → Tracks the last checked game ID.

---

## 🛠️ How It Works
1. Scrapes Steam store pages for free games.
2. Checks if they include **achievements** or **Steam trading cards**.
3. Saves results in text files.
4. Automatically commits and pushes updates to the repository.

---

## ⚡ Automating Updates
This script automatically pushes updates to GitHub when new free games are found.

If you want to **manually push updates**, run:
```sh
git add free_games_with_achievements.txt free_games_with_cards.txt progress.json
git commit -m "Updated free games list"
git push origin main
```

---

## 📜 License
This project is **open-source** under the **MIT License**.

---

## 🤝 Contributing
Pull requests are welcome! If you find a bug or have an idea for improvement, feel free to open an issue.

---

## 📞 Contact
- GitHub: [ohsyme](https://github.com/ohsyme)

---

Happy gaming! 🎮🚀

