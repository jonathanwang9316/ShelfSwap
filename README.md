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
* **Backend:** Node.js (with Python integration)
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
