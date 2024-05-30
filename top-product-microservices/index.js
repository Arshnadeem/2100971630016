const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const app = express();
const port = 3000; // New port number assigned

const ecomBaseUrl = 'http://20.244.56.144/test/companies';
const companies = ["AMZ", "PSP", "MYN", "AZO"];
const categories = ["Phone", "Computer", "TV", "Earphone", "Tablet", "Charger", "House", "Keypad", "Bluetooth", "Pendrive", "Remote", "Speaker", "Headset", "Laptop", "PC"];

// Fetch products from all companies
const fetchProductsFromCompany = async (company, category, minPrice, maxPrice, n) => {
    const url = `${ecomBaseUrl}/${company}/categories/${category}/products/top-${n}?minPrice=${minPrice}&maxPrice=${maxPrice}`;
    try {
        const response = await axios.get(url);
        return response.data.map(product => ({
            ...product,
            id: uuidv4(),
            company
        }));
    } catch (error) {
        console.error(`Error fetching products from ${company}: ${error.message}`);
        return [];
    }
};

app.get('/categories/:category/products', async (req, res) => {
    const { category } = req.params;
    const { n = 10, page = 1, minPrice = 0, maxPrice = Infinity, sortBy = 'price', sortOrder = 'asc' } = req.query;
    if (!categories.includes(category)) {
        return res.status(400).send('Invalid category');
    }

    const fetchPromises = companies.map(company => fetchProductsFromCompany(company, category, minPrice, maxPrice, n));
    const productsArrays = await Promise.all(fetchPromises);
    let allProducts = productsArrays.flat();

    // Sorting
    allProducts.sort((a, b) => {
        const compare = (a[sortBy] < b[sortBy]) ? -1 : (a[sortBy] > b[sortBy]) ? 1 : 0;
        return sortOrder === 'asc' ? compare : -compare;
    });

    // Pagination
    const totalProducts = allProducts.length;
    const pageSize = parseInt(n, 10);
    const totalPages = Math.ceil(totalProducts / pageSize);
    const paginatedProducts = allProducts.slice((page - 1) * pageSize, page * pageSize);

    res.json({
        products: paginatedProducts,
        totalProducts,
        totalPages,
        currentPage: parseInt(page, 10)
    });
});

app.get('/categories/:category/products/:productid', async (req, res) => {
    const { productid } = req.params;
    const fetchPromises = companies.map(company => fetchProductsFromCompany(company, category, 0, Infinity, 100));
    const productsArrays = await Promise.all(fetchPromises);
    const allProducts = productsArrays.flat();
    const product = allProducts.find(p => p.id === productid);

    if (product) {
        res.json(product);
    } else {
        res.status(404).send('Product not found');
    }
});

app.listen(port, () => {
    console.log(`Top Products Microservice running on http://localhost:${port}`);
});
