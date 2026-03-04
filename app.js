document.addEventListener('DOMContentLoaded', () => {
    const addRecipeModal = document.getElementById('addRecipeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const recipeForm = document.getElementById('recipeForm');
    const recipeGrid = document.getElementById('recipeGrid');

    const viewRecipeModal = document.getElementById('viewRecipeModal');
    const closeViewModalBtn = document.getElementById('closeViewModalBtn');

    // New Elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const toastContainer = document.getElementById('toastContainer');
    const starRatingInput = document.getElementById('starRatingInput');
    const recipeRatingHidden = document.getElementById('recipeRating');

    // Admin Elements
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const addRecipeBtn = document.getElementById('addRecipeBtn');
    const shareRecipeBtn = document.getElementById('shareRecipeBtn');
    const editRecipeBtn = document.getElementById('editRecipeBtn');
    const deleteRecipeBtn = document.getElementById('deleteRecipeBtn');

    const detailImage = document.getElementById('detailImage');
    const detailDate = document.getElementById('detailDate');
    const detailTitle = document.getElementById('detailTitle');
    const detailDesc = document.getElementById('detailDesc');

    let recipes = [];
    let currentViewingId = null;
    let visibleCount = 9;

    // Toast Notification System
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        if (type === 'success') icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        if (type === 'error') icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        if (type === 'warning') icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

        toast.innerHTML = `${icon}<span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('hiding'), 3000);
        setTimeout(() => toast.remove(), 3300);
    };

    // Star Rating Logic
    const stars = starRatingInput.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = star.getAttribute('data-value');
            recipeRatingHidden.value = val;
            updateStarUI(val);
        });

        star.addEventListener('mouseenter', () => {
            const hoverVal = star.getAttribute('data-value');
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= hoverVal) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hover'));
            updateStarUI(recipeRatingHidden.value);
        });
    });

    const updateStarUI = (val) => {
        stars.forEach(s => {
            if (s.getAttribute('data-value') <= val) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    };

    // Admin State Management
    let isAdmin = sessionStorage.getItem('cookerDiaryAdmin') === 'true';
    let adminPassword = sessionStorage.getItem('cookerDiaryPassword') || '';

    const updateAdminUI = () => {
        if (isAdmin) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            addRecipeBtn.classList.remove('hidden');
            editRecipeBtn.classList.remove('hidden');
            deleteRecipeBtn.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            addRecipeBtn.classList.add('hidden');
            editRecipeBtn.classList.add('hidden');
            deleteRecipeBtn.classList.add('hidden');
        }
    };

    loginBtn.addEventListener('click', () => {
        const password = prompt('Enter Admin Password:');
        if (password === 'cook123') { // Simple hardcoded check
            isAdmin = true;
            adminPassword = password;
            sessionStorage.setItem('cookerDiaryAdmin', 'true');
            sessionStorage.setItem('cookerDiaryPassword', password);
            updateAdminUI();
            showToast('Logged in as Admin successfully', 'success');
        } else if (password !== null) {
            showToast('Incorrect password', 'error');
        }
    });

    logoutBtn.addEventListener('click', () => {
        isAdmin = false;
        adminPassword = '';
        sessionStorage.removeItem('cookerDiaryAdmin');
        sessionStorage.removeItem('cookerDiaryPassword');
        updateAdminUI();
        showToast('Logged out successfully', 'success');
        // If viewing a modal, hide admin buttons
        if (viewRecipeModal.classList.contains('active')) {
            editRecipeBtn.classList.add('hidden');
            deleteRecipeBtn.classList.add('hidden');
        }
    });

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const renderRecipes = () => {
        recipeGrid.innerHTML = '';

        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        // Filter functionality
        const filteredRecipes = recipes.filter(recipe => {
            const matchesSearch = recipe.title.toLowerCase().includes(searchTerm) ||
                recipe.description.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        if (filteredRecipes.length === 0) {
            recipeGrid.innerHTML = `
                <div class="no-recipes">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.8"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <h3>No recipes found</h3>
                    <p>Try adjusting your search or add a new recipe.</p>
                </div>
            `;
            return;
        }

        const sortBy = sortFilter.value;
        let sortedRecipes = [...filteredRecipes];
        if (sortBy === 'newest') sortedRecipes.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sortBy === 'oldest') sortedRecipes.sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortBy === 'highest') sortedRecipes.sort((a, b) => parseInt(b.rating || '0') - parseInt(a.rating || '0'));
        if (sortBy === 'lowest') sortedRecipes.sort((a, b) => parseInt(a.rating || '0') - parseInt(b.rating || '0'));

        const recipesToShow = sortedRecipes.slice(0, visibleCount);

        recipesToShow.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.dataset.id = recipe.id;

            let imagePath = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
            if (recipe.image) {
                imagePath = recipe.image.startsWith('http') || recipe.image.startsWith('data:') ? recipe.image : `assets/${recipe.image}`;
            }

            const categoryLabel = recipe.category || 'Uncategorized';
            const ratingNum = parseInt(recipe.rating || '0', 10);
            const ratingHtml = '★'.repeat(ratingNum) + '<span style="color: #475569">' + '★'.repeat(5 - ratingNum) + '</span>';

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${imagePath}" alt="${recipe.title}" class="card-image" onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span class="card-category">${categoryLabel}</span>
                        <div class="card-rating">${ratingHtml}</div>
                    </div>
                    <span class="card-date">${formatDate(recipe.date)}</span>
                    <h3 class="card-title">${recipe.title}</h3>
                    <p class="card-desc">${recipe.description}</p>
                </div>
            `;

            card.addEventListener('click', () => openViewModal(recipe));
            recipeGrid.appendChild(card);
        });

        if (visibleCount >= sortedRecipes.length) {
            loadMoreBtn.classList.add('hidden');
        } else {
            loadMoreBtn.classList.remove('hidden');
        }
    };

    // Event Listeners for Filtering and Pagination
    searchInput.addEventListener('input', () => { visibleCount = 9; renderRecipes(); });
    categoryFilter.addEventListener('change', () => { visibleCount = 9; renderRecipes(); });
    sortFilter.addEventListener('change', () => { visibleCount = 9; renderRecipes(); });
    loadMoreBtn.addEventListener('click', () => {
        visibleCount += 9;
        renderRecipes();
    });

    addRecipeBtn.addEventListener('click', () => {
        addRecipeModal.classList.add('active');
        document.querySelector('#addRecipeModal h2').textContent = 'New Recipe';
        isEditing = false;
        recipeForm.reset();
        recipeRatingHidden.value = '0';
        updateStarUI(0);
    });

    closeModalBtn.addEventListener('click', () => {
        addRecipeModal.classList.remove('active');
        recipeForm.reset();
    });

    let isEditing = false;
    let editRecipeId = null;

    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let targetUrl = 'http://localhost:3000/recipes';
        let method = 'POST';

        // 1. Handle actual image file upload if a file is selected
        let finalImageName = '';
        const imageFileInput = document.getElementById('recipeImage');
        if (imageFileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('image', imageFileInput.files[0]);

            try {
                const uploadRes = await fetch('http://localhost:3000/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${adminPassword}` },
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    finalImageName = uploadData.filename;
                } else {
                    showToast('Failed to upload image', 'error');
                    return;
                }
            } catch (err) {
                console.error('Upload error', err);
                showToast('Image upload error', 'error');
                return;
            }
        }

        const recipeData = {
            id: isEditing ? editRecipeId : Date.now().toString(),
            title: document.getElementById('recipeTitle').value,
            image: finalImageName || (isEditing ? recipes.find(r => r.id === editRecipeId).image : ''),
            description: document.getElementById('recipeDesc').value,
            date: isEditing ? recipes.find(r => r.id === editRecipeId).date : new Date().toISOString(),
            category: document.getElementById('recipeCategory').value,
            rating: document.getElementById('recipeRating').value
        };

        if (isEditing) {
            targetUrl = `http://localhost:3000/recipes/${editRecipeId}`;
            method = 'PUT';
        }

        console.log('--- SUBMIT RECIPE ---');
        console.log('isEditing:', isEditing);
        console.log('editRecipeId:', editRecipeId);
        console.log('targetUrl:', targetUrl);
        console.log('method:', method);
        console.log('recipeData:', recipeData);

        try {
            const response = await fetch(targetUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminPassword}`
                },
                body: JSON.stringify(recipeData)
            });

            if (response.ok) {
                if (isEditing) {
                    const index = recipes.findIndex(r => r.id === editRecipeId);
                    if (index !== -1) recipes[index] = recipeData;
                    viewRecipeModal.classList.remove('active');
                    showToast('Recipe updated successfully!', 'success');
                } else {
                    recipes.push(recipeData);
                    showToast('Recipe saved successfully!', 'success');
                }
                renderRecipes();
            } else {
                showToast(isEditing ? 'Failed to update recipe' : 'Failed to save recipe', 'error');
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            showToast('Cannot save recipe. Server running?', 'error');
        }

        addRecipeModal.classList.remove('active');
        recipeForm.reset();
        recipeRatingHidden.value = '0';
        updateStarUI(0);
        isEditing = false;
    });

    const openViewModal = (recipe) => {
        currentViewingId = recipe.id;

        let imagePath = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        if (recipe.image) {
            imagePath = recipe.image.startsWith('http') ? recipe.image : `assets/${recipe.image}`;
        }

        detailImage.src = imagePath;
        detailImage.onerror = () => { detailImage.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' };

        detailDate.textContent = formatDate(recipe.date);
        detailTitle.textContent = recipe.title;

        // Parse markdown text before rendering
        if (typeof marked !== 'undefined') {
            detailDesc.innerHTML = marked.parse(recipe.description);
        } else {
            detailDesc.textContent = recipe.description;
        }

        if (isAdmin) {
            editRecipeBtn.classList.remove('hidden');
            deleteRecipeBtn.classList.remove('hidden');
        }

        viewRecipeModal.classList.add('active');
    };

    closeViewModalBtn.addEventListener('click', () => {
        viewRecipeModal.classList.remove('active');
        setTimeout(() => { currentViewingId = null; }, 300);
    });

    editRecipeBtn.addEventListener('click', () => {
        const recipe = recipes.find(r => r.id === currentViewingId);
        if (!recipe) return;

        // Auto-close the view modal seamlessly when transferring to the edit modal
        viewRecipeModal.classList.remove('active');

        isEditing = true;
        editRecipeId = recipe.id;

        document.querySelector('#addRecipeModal h2').textContent = 'Edit Recipe';
        document.getElementById('recipeTitle').value = recipe.title;
        // Image input is a file input, so we can't pre-fill it due to browser security.
        // The user must re-upload or leave it alone to keep the old image.
        document.getElementById('recipeImage').value = '';
        document.getElementById('recipeCategory').value = recipe.category || 'Breakfast';
        document.getElementById('recipeDesc').value = recipe.description;

        const rating = recipe.rating || '0';
        recipeRatingHidden.value = rating;
        updateStarUI(parseInt(rating));

        addRecipeModal.classList.add('active');
    });

    deleteRecipeBtn.addEventListener('click', async () => {
        // Custom confirmation logic
        showToast('Processing deletion...', 'warning');

        try {
            const response = await fetch(`http://localhost:3000/recipes/${currentViewingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminPassword}`
                }
            });

            if (response.ok) {
                recipes = recipes.filter(r => r.id !== currentViewingId);
                renderRecipes();
                viewRecipeModal.classList.remove('active');
                showToast('Recipe deleted permanently', 'success');
            } else {
                showToast('Failed to delete recipe', 'error');
            }
        } catch (error) {
            console.error('Error deleting recipe:', error);
            showToast('Cannot delete recipe. Server running?', 'error');
        }
    });

    shareRecipeBtn.addEventListener('click', () => {
        if (!currentViewingId) return;
        const url = new URL(window.location.href);
        url.searchParams.set('id', currentViewingId);

        // Write to clipboard
        navigator.clipboard.writeText(url.toString()).then(() => {
            showToast('Share link copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy link:', err);
            showToast('Failed to copy link', 'error');
        });
    });

    const fetchRecipes = async () => {
        try {
            const response = await fetch('http://localhost:3000/recipes');
            if (response.ok) {
                recipes = await response.json();
                renderRecipes();

                // Check if there is an ?id= parameter to open a shared recipe
                const urlParams = new URLSearchParams(window.location.search);
                const shareId = urlParams.get('id');
                if (shareId) {
                    const sharedRecipe = recipes.find(r => r.id === shareId);
                    if (sharedRecipe) {
                        openViewModal(sharedRecipe);
                    }
                }
            } else {
                showToast('Failed to load recipes', 'error');
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            showToast('Cannot connect to local server.', 'error');
            recipes = [];
            renderRecipes();
        }
    };

    window.addEventListener('click', (e) => {
        if (e.target === addRecipeModal) {
            addRecipeModal.classList.remove('active');
        }
        if (e.target === viewRecipeModal) {
            viewRecipeModal.classList.remove('active');
        }
    });

    fetchRecipes();
    updateAdminUI(); // Initialize admin state on load
});
