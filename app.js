// Initialisation de Supabase
const supabaseClient = supabase.createClient('https://grxcjytkisswabnxwzrb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyeGNqeXRraXNzd2Fibnh3enJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzMjgzODAsImV4cCI6MjAzNjkwNDM4MH0.5t7sGuaiGuYoChM71yWfwH8bxOwmRRjinoCYvXO9v7U');

const addProductForm = document.getElementById('add-product-form');
const productListContainer = document.getElementById('product-list-container');
const filterDateInput = document.getElementById('filter-date');
const noResultsMessage = document.getElementById('no-results-message');

// Fonction pour récupérer et afficher les produits depuis Supabase
async function fetchProducts(filterDate = null) {
    try {
        let query = supabaseClient.from('products').select('*');

        if (filterDate) {
            // Définir le début et la fin de la journée pour le filtrage
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

        // Effacer la liste actuelle avant de la mettre à jour
        productListContainer.innerHTML = '';

        // Afficher un message si aucun produit n'est trouvé
        if (products.length === 0) {
            noResultsMessage.style.display = 'block';
            return;
        } else {
            noResultsMessage.style.display = 'none';
        }

        // Grouper les produits par date
        const groupedProducts = products.reduce((acc, product) => {
            const date = new Date(product.created_at).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(product);
            return acc;
        }, {});

        // Afficher chaque groupe de produits
        for (const [date, products] of Object.entries(groupedProducts)) {
            const dateSection = document.createElement('section');
            const dateHeader = document.createElement('h3');
            dateHeader.textContent = date;
            dateSection.appendChild(dateHeader);

            const productList = document.createElement('ul');
            products.forEach(product => {
                const listItem = document.createElement('li');
                listItem.textContent = `${product.name} - ${product.quantity} x ${product.price} (Ajouté le ${new Date(product.created_at).toLocaleDateString()})`;

                // Ajouter un bouton de suppression
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
fetchProducts();

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
        { name: productName, price: productPrice, quantity: productQuantity }
    ]);

    if (error) {
        console.error('Erreur lors de l\'ajout du produit:', error.message);
        return;
    }

    if (data && data.length > 0) {
        fetchProducts(); // Recharger la liste des produits
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

        fetchProducts(); // Recharger la liste des produits après suppression
    }
});

// Gestion du filtrage par date
filterDateInput.addEventListener('input', () => {
    const filterDate = filterDateInput.value ? new Date(filterDateInput.value).toISOString().split('T')[0] : null;
    console.log('Filter Date:', filterDate); // Debug: Vérifiez que la date est correctement récupérée
    fetchProducts(filterDate);
});
