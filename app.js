// Initialisation de Supabase
const supabaseClient = supabase.createClient('https://grxcjytkisswabnxwzrb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyeGNqeXRraXNzd2Fibnh3enJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzMjgzODAsImV4cCI6MjAzNjkwNDM4MH0.5t7sGuaiGuYoChM71yWfwH8bxOwmRRjinoCYvXO9v7U');

const addProductForm = document.getElementById('add-product-form');
const productListContainer = document.getElementById('product-list-container');
const filterDateInput = document.getElementById('filter-date');
const noResultsMessage = document.getElementById('no-results-message');
const showLoginBtn = document.getElementById('show-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

let currentUser = null;

// Afficher le formulaire de connexion
showLoginBtn.addEventListener('click', () => {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
});

// Afficher le formulaire d'inscription
showRegisterBtn.addEventListener('click', () => {
    registerSection.style.display = 'block';
    loginSection.style.display = 'none';
});

// Gestion de l'inscription
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const { user, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        console.error('Erreur lors de l\'inscription:', error.message);
        alert('Erreur lors de l\'inscription: ' + error.message);
        return;
    }

    alert('Inscription réussie! Vérifiez votre email pour confirmer votre compte.');
    registerForm.reset();
    registerSection.style.display = 'none';
});

// Gestion de la connexion
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { user, session, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    

    if (error) {
        console.error('Erreur lors de la connexion:', error.message);
        alert('Erreur lors de la connexion: ' + error.message);
        return;
    }

    alert('Connexion réussie!');
    loginForm.reset();
    loginSection.style.display = 'none';

    currentUser = user;
    fetchProducts();
});

// Fonction pour récupérer et afficher les produits depuis Supabase
async function fetchProducts(filterDate = null) {
    try {
        let query = supabaseClient.from('products').select('*').eq('user_id', currentUser.id);

        if (filterDate) {
            const startDate = new Date(filterDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(filterDate);
            endDate.setHours(23, 59, 59, 999);

            query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
        }

        const { data: products, error } = await query;

        if (error) {
            throw error;
        }

        productListContainer.innerHTML = '';

        if (products.length === 0) {
            noResultsMessage.style.display = 'block';
            return;
        } else {
            noResultsMessage.style.display = 'none';
        }

        const groupedProducts = products.reduce((acc, product) => {
            const date = new Date(product.created_at).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(product);
            return acc;
        }, {});

        for (const [date, products] of Object.entries(groupedProducts)) {
            const dateSection = document.createElement('section');
            const dateHeader = document.createElement('h3');
            dateHeader.textContent = date;
            dateSection.appendChild(dateHeader);

            const productList = document.createElement('ul');
            products.forEach(product => {
                const listItem = document.createElement('li');
                listItem.textContent = `${product.name} - ${product.quantity} x ${product.price} (Ajouté le ${new Date(product.created_at).toLocaleDateString()})`;

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Supprimer';
                deleteBtn.dataset.productId = product.id;
                listItem.appendChild(deleteBtn);

                productList.appendChild(listItem);
            });

            dateSection.appendChild(productList);
            productListContainer.appendChild(dateSection);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error.message);
    }
}

// Appeler la fonction pour récupérer et afficher les produits au chargement de la page
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        fetchProducts();
    } else {
        currentUser = null;
        productListContainer.innerHTML = '';
    }
});

// Gestion de l'ajout d'un produit
addProductForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const productName = document.getElementById('product-name').value;
    const productPrice = parseFloat(document.getElementById('product-price').value);
    const productQuantity = parseInt(document.getElementById('product-quantity').value);

    if (!productName || isNaN(productPrice) || isNaN(productQuantity)) {
        alert('Veuillez remplir tous les champs avec des valeurs valides.');
        return;
    }

    const { data, error } = await supabaseClient.from('products').insert([
        { name: productName, price: productPrice, quantity: productQuantity, user_id: currentUser.id }
    ]);

    if (error) {
        console.error('Erreur lors de l\'ajout du produit:', error.message);
        return;
    }

    if (data && data.length > 0) {
        fetchProducts();
        addProductForm.reset();
    } else {
        console.error('Aucune donnée retournée après l\'ajout du produit.');
    }
});

// Gestion de la suppression d'un produit
productListContainer.addEventListener('click', async (event) => {
    if (event.target.tagName === 'BUTTON') {
        const productId = event.target.dataset.productId;

        const { error } = await supabaseClient.from('products').delete().eq('id', productId);

        if (error) {
            console.error('Erreur lors de la suppression du produit:', error.message);
            return;
        }

        fetchProducts();
    }
});

// Gestion du filtrage par date
filterDateInput.addEventListener('input', () => {
    const filterDate = filterDateInput.value ? new Date(filterDateInput.value).toISOString().split('T')[0] : null;
    fetchProducts(filterDate);
});
