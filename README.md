# ShelfSwap

**ShelfSwap** is a community-driven web application designed to help readers manage their personal book collections and connect with others to exchange books. Unlike static library trackers, ShelfSwap emphasizes community-based exchange, allowing users to catalog their libraries, discover others' collections, and propose swaps.

---

## Key Features

* **Personal Digital Library:** Easily catalog and manage your physical book collection in a digital format.
* **Peer-to-Peer Exchange:** Browse others’ libraries and send/receive trade proposals to refresh your bookshelf.
* **Community Hub:** Discover users with shared reading interests and join virtual book clubs.
* **Relational Tracking:** High-integrity tracking of book ownership, swap history, and user relationships.

---

## Tech Stack

* **Frontend:** React.js
* **Backend:** Node.js & Python
* **Database:** MySQL 8.0 (Hosted on Google Cloud Platform / CloudSQL)
* **Architecture:** RESTful API with a normalized relational schema.

---

## Project Structure

```text
├── client/              # React frontend source code
├── server/              # Node.js & Python backend logic
├── doc/                 # Database Design (ER Diagrams) and Stage Reports
├── .gitignore           # Git exclusion rules (node_modules, .env, etc.)
└── README.md            # Project documentation
```

---

## Installation & Setup

To get a local copy of ShelfSwap up and running, follow these steps:

### 1. Clone the Repository
```bash
git clone [https://github.com/jonathanwang9316/ShelfSwap.git](https://github.com/jonathanwang9316/ShelfSwap.git)
cd ShelfSwap
```

### 2. Environment Configuration
Create a `.env` file in the `server/` directory and add your GCP CloudSQL credentials:
```text
DB_HOST=your_gcp_ip
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=shelfswap_db
```

### 3. Install Dependencies
**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

### 4. Run the Application
Start the backend server:
```bash
# Inside /server
npm start
```
Start the frontend development server:
```bash
# Inside /client
npm start
```

---

## 🏗️ Database Design
The application is powered by a robust MySQL relational database. The schema is designed to handle complex many-to-many relationships between users and books through a centralized `Swaps` table. 

> **Note:** For a full ER Diagram and detailed table specifications, please check the `/doc` folder.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
