# 🐊 Gator – Blog Aggregator

Gator is a command-line RSS feed aggregator that allows you to manage subscriptions and read the latest technical blog posts directly from your terminal.

Built with **Node.js**, **TypeScript**, **PostgreSQL**, and **Drizzle ORM**.

---

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- **npm** (comes with Node.js)

---

## 🚀 Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd BlogAggregator
```

---

### 2️⃣ Configure the Database

Create a local PostgreSQL database:

```bash
createdb gator
```

---

### 3️⃣ Initialize the Config File

Gator stores its settings in your home directory.

Create a file named:

```bash
~/.gatorconfig.json
```

Add the following:

```json
{
  "db_url": "postgres://localhost:5432/gator",
  "current_user_name": ""
}
```

> **Note:**  
If your PostgreSQL setup requires a username or password, use:

```
postgres://user:password@localhost:5432/gator
```

---

### 4️⃣ Run Migrations

Push the schema to your database using Drizzle ORM:

```bash
npx drizzle-kit push
```

---

# 💻 Command Reference

## 👤 User Commands

| Command | Description |
|----------|------------|
| `npm start register <name>` | Creates a new user account and sets them as the active user |
| `npm start login <name>` | Switches the active user |
| `npm start users` | Displays all registered users |

---

## 📡 Feed & Subscription Commands

| Command | Description |
|----------|------------|
| `npm start addfeed <name> <url>` | Adds a new RSS feed and follows it automatically |
| `npm start feeds` | Lists all tracked feeds |
| `npm start follow <url>` | Subscribes the current user to an existing feed |
| `npm start unfollow <url>` | Unsubscribes the current user from a feed |
| `npm start following` | Lists feeds the current user follows |

---

## 🔄 Aggregator & Browser

| Command | Description |
|----------|------------|
| `npm start agg` | Starts the background worker that fetches feeds every minute |
| `npm start browse <limit>` | Displays latest posts from followed feeds (e.g. `npm start browse 5`) |

---

## 🧹 Maintenance

| Command | Description |
|----------|------------|
| `npm start help` | Displays help menu |
| `npm start reset` | ⚠️ Clears all users, feeds, and posts from the database |

---

# ⚙️ Architecture

### 🗄 Database Persistence
Uses **PostgreSQL** with **Drizzle ORM** for type-safe queries.

### 🔁 Background Worker
The `agg` command runs a fetching loop that updates feeds based on their `last_fetched_at` timestamp.

### 🧠 Smart Deduplication
Uses unique constraints on post URLs to prevent duplicate posts across multiple scrapes.

### 🔐 Middleware Logic
A custom `loggedIn` middleware ensures protected commands only run when a valid user exists in the config.

---

# ❓ Troubleshooting

### ❌ "Postgres connection refused"

Make sure PostgreSQL is running:

**Mac:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo service postgresql start
```

---

### ❌ "Foreign key constraint violation"

If you manually delete data using `psql`, remember:

- Feeds belong to users  
- Posts belong to feeds  

Use `CASCADE` when deleting, or run:

```bash
npm start reset
```
