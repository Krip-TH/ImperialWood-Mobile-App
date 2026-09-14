# 🚪 ImperialWood Mobile App

**ImperialWood** is a mobile application for door product management and shopping.  
The application provides features for customers to browse products, manage favorites, add products to a shopping cart, place orders, and view store information.

The system also provides administrative functions for managing products, stores, inventory, and orders.

---

## 📱 Main Features

### 👤 Customer
- Browse door products and accessories
- Search and view product details
- Browse products by category
- Add products to favorites
- Add products to shopping cart
- Place orders
- View order information
- View ImperialWood store information

### 🛠️ Administrator
- Add, edit, and delete products
- Manage product categories
- Manage store information
- Manage store inventory
- Manage orders
- Manage product information and images

---

## 🧰 Technologies

### Frontend

- React Native
- Expo
- Expo Router
- AsyncStorage
- Expo Image
- Expo Image Picker
- Expo File System

### Backend

- Node.js
- Express.js
- MySQL
- MySQL2
- CORS
- dotenv
- bcryptjs

### Development Tools

- Visual Studio Code
- Android Studio
- Expo
- Git
- GitHub
- phpMyAdmin

---

## 📂 Project Structure

```text
ImperialWood-Mobile-App/
│
├── assets/                 # Images and application assets
├── src/                    # Application source code
├── my-Backend-MySQL/       # Node.js / Express / MySQL backend
├── scripts/                # Project scripts
├── stock-clustering/       # Product stock clustering
├── products.json           # Product data
├── app.json                # Expo configuration
├── package.json            # Frontend dependencies
├── User-Manual.pdf         # Complete project user manual
└── README.md
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Krip-TH/ImperialWood-Mobile-App.git
```

Then enter the project directory:

```bash
cd ImperialWood-Mobile-App
```

---

### 2. Install Frontend Dependencies

```bash
npm install
```

---

### 3. Start the Frontend

```bash
npx expo start
```

The application can then be opened using Expo or an Android emulator.

---

## 🖥️ Backend Setup

Enter the MySQL backend directory:

```bash
cd my-Backend-MySQL
```

Install backend dependencies:

```bash
npm install
```

Configure the required environment variables using the provided:

```text
.env.example
```

> ⚠️ Do not upload your real `.env` file containing database passwords, tokens, or other private credentials to GitHub.

---

## 🗄️ Database Setup

The ImperialWood backend uses **MySQL** as its database.

To import the database:

1. Open **phpMyAdmin**
2. Select or create the ImperialWood database
3. Open the **Import** tab
4. Select the provided `.sql` database file
5. Set the format to **SQL**
6. Click **Import**
7. Open the **Structure** tab to verify the imported tables

The database is used to manage application data such as:

- Users
- Products
- Categories
- Stores
- Store inventory
- Store photos
- Favorites
- Shopping carts
- Orders

---

## 🔗 System Architecture

```text
Mobile Application
React Native + Expo
        │
        │ REST API
        ▼
Node.js + Express.js
        │
        ▼
      MySQL
        │
        ▼
   phpMyAdmin
```

---

## 📖 User Manual

A complete guide covering project installation, dependencies, backend configuration, database setup, and project structure is available here:

### 👉 [View ImperialWood User Manual](./User-Manual.pdf)

---

## 🔗 Repository

**GitHub Repository:**  
https://github.com/Krip-TH/ImperialWood-Mobile-App

---

## 👨‍💻 Author

**Krip Topongkasem**

ImperialWood Mobile App

---

## 📄 License

This project includes an MIT License. See the `LICENSE` file for more information.
