const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csvParser = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;
const CSV_FILE_PATH = 'database.csv';
const ADMIN_PASSWORD = 'cook123';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure assets directory exists
if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Clean original name of spaces to prevent URL-encoding weirdness
        const cleanName = file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});
const upload = multer({ storage: storage });

// Auth Middleware
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    next();
};

// Set up CSV Writer
const csvWriter = createObjectCsvWriter({
    path: CSV_FILE_PATH,
    header: [
        { id: 'id', title: 'id' },
        { id: 'title', title: 'title' },
        { id: 'image', title: 'image' },
        { id: 'description', title: 'description' },
        { id: 'date', title: 'date' },
        { id: 'category', title: 'category' },
        { id: 'rating', title: 'rating' }
    ],
    append: true
});

// Helper: Read recipes from CSV
const readRecipesFromCsv = () => {
    return new Promise((resolve, reject) => {
        const recipes = [];
        if (!fs.existsSync(CSV_FILE_PATH)) {
            return resolve(recipes);
        }

        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csvParser())
            .on('data', (data) => recipes.push(data))
            .on('end', () => resolve(recipes))
            .on('error', (err) => reject(err));
    });
};

// Helper: Rewrite all recipes to CSV (for delete operation)
const rewriteCsv = async (recipes) => {
    const writer = createObjectCsvWriter({
        path: CSV_FILE_PATH,
        header: [
            { id: 'id', title: 'id' },
            { id: 'title', title: 'title' },
            { id: 'image', title: 'image' },
            { id: 'description', title: 'description' },
            { id: 'date', title: 'date' },
            { id: 'category', title: 'category' },
            { id: 'rating', title: 'rating' }
        ],
        append: false // Overwrite the file
    });

    // Create an empty file with headers if array is empty
    if (recipes.length === 0) {
        fs.writeFileSync(CSV_FILE_PATH, 'id,title,image,description,date,category,rating\n');
        return;
    }

    await writer.writeRecords(recipes);
};

// GET /recipes - Get all recipes
app.get('/recipes', async (req, res) => {
    try {
        const recipes = await readRecipesFromCsv();
        res.json(recipes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read recipes' });
    }
});

// POST /upload - Upload an image (Requires Admin)
app.post('/upload', requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the filename so the frontend can save it to the CSV record
    res.json({ filename: req.file.filename });
});

// POST /recipes - Add a new recipe (Requires Admin)
app.post('/recipes', requireAdmin, async (req, res) => {
    const { id, title, image, description, date, category, rating } = req.body;

    if (!id || !title || !description || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newRecord = {
            id,
            title,
            image: image || '',
            description,
            date,
            category: category || 'Uncategorized',
            rating: rating || '0'
        };
        await csvWriter.writeRecords([newRecord]);
        res.status(201).json({ message: 'Recipe added successfully', recipe: newRecord });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save recipe' });
    }
});

// PUT /recipes/:id - Update an existing recipe (Requires Admin)
app.put('/recipes/:id', requireAdmin, async (req, res) => {
    const recipeId = req.params.id;
    const { title, image, description, date, category, rating } = req.body;

    try {
        const recipes = await readRecipesFromCsv();
        const recipeIndex = recipes.findIndex(r => r.id === recipeId);

        if (recipeIndex === -1) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const oldImage = recipes[recipeIndex].image;

        // Safely delete the old image if a new image was uploaded
        if (image !== undefined && image !== '' && image !== oldImage && oldImage) {
            try {
                const oldImagePath = path.join(__dirname, 'assets', oldImage);
                if (fs.existsSync(oldImagePath)) {
                    // This might fail if the file is currently being read by the browser on Windows (EBUSY lock)
                    // If it does, we just ignore it to avoid crashing the server.
                    fs.unlinkSync(oldImagePath);
                }
            } catch (err) {
                console.log(`Could not delete orphaned image ${oldImage}:`, err.message);
            }
        }

        // Update the recipe fields, ensuring all variables map correctly
        recipes[recipeIndex] = {
            id: recipeId,
            title: title !== undefined ? title : recipes[recipeIndex].title,
            image: image !== undefined ? image : recipes[recipeIndex].image,
            description: description !== undefined ? description : recipes[recipeIndex].description,
            date: date !== undefined ? date : recipes[recipeIndex].date,
            category: category !== undefined ? category : (recipes[recipeIndex].category || 'Uncategorized'),
            rating: rating !== undefined ? rating : (recipes[recipeIndex].rating || '0')
        };

        await rewriteCsv(recipes);
        res.json({ message: 'Recipe updated successfully', recipe: recipes[recipeIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update recipe' });
    }
});

// DELETE /recipes/:id - Delete a recipe (Requires Admin)
app.delete('/recipes/:id', requireAdmin, async (req, res) => {
    const recipeId = req.params.id;

    try {
        const recipes = await readRecipesFromCsv();
        const initialLength = recipes.length;
        const filteredRecipes = recipes.filter(r => r.id !== recipeId);

        if (filteredRecipes.length === initialLength) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        await rewriteCsv(filteredRecipes);
        res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // Ensure CSV file exists with headers if it doesn't already
    if (!fs.existsSync(CSV_FILE_PATH)) {
        fs.writeFileSync(CSV_FILE_PATH, 'id,title,image,description,date,category,rating\n');
        console.log('Created initial empty database.csv file.');
    }
});
