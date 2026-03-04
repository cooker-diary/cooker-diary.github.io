# Cooker Diary

A dynamic, beautifully styled personal recipe management web application. Cooker Diary allows users to easily manage, filter, and share their favorite recipes and ingredients.

## Features
- **Dynamic Filtering & Sorting:** Instantly search through recipes, filter by category (including Ingredients), and sort by newest, oldest, or highest rating.
- **Image Uploads:** Upload real images directly from your computer using Node's `multer`, replacing legacy URL inputs.
- **Markdown Support:** Write beautiful recipe descriptions with Markdown text formatting (bold, italic, lists) parsed by `marked.js`.
- **Recipe Sharing:** One-click copyable sharing links (`?id=`) for individual recipes.
- **Glassmorphism UI:** Stunning modern design with smooth animations, pill buttons, and interactive components.
- **Secure Admin Controls:** Password-protected CRUD (Create, Update, Delete) powers.

## Installation
1. Ensure Node.js is installed on your machine.
2. Clone the repository and navigate to the directory:
   ```bash
   cd cooker_diary
   ```
3. Install dependencies:
   ```bash
   npm install express cors csv-parser csv-writer multer
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. Open `index.html` in your web browser. 

## Usage
- **View Mode:** Anyone can search, view, and read recipes as a guest.
- **Admin Mode:** To add, edit, or delete recipes, enter the Admin Mode by clicking the gear icon or pressing `Ctrl + Shift + A` (or `Cmd + Shift + A` on Mac) and entering the default password (`cook123`).

## License
This project is provided under the MIT License. Copyright &copy; 2026 Cooker Diary. See the `LICENSE` file for details.

## Disclaimer
Recipes and ingredients are provided for informational and personal tracking purposes. Nutritional values are approximate and may vary based on specific ingredients used.
