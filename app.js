// Importamos los módulos necesarios
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Inicializamos la aplicación Express
const app = express();
const PORT = 8080;

app.use(express.json());

// Definimos la clase ProductManager
class ProductManager {
    constructor(filePath) {
        this.path = filePath;
    }

    async getProducts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async addProduct(product) {
        const products = await this.getProducts();
        const newProduct = {
            id: products.length ? products[products.length - 1].id + 1 : 1,
            ...product
        };
        products.push(newProduct);
        await fs.writeFile(this.path, JSON.stringify(products, null, 2));
        return newProduct;
    }

    async getProductById(id) {
        const products = await this.getProducts();
        return products.find(p => p.id === id) || null;
    }

    async updateProduct(id, updatedFields) {
        const products = await this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return null;

        products[index] = { ...products[index], ...updatedFields };
        await fs.writeFile(this.path, JSON.stringify(products, null, 2));
        return products[index];
    }

    async deleteProduct(id) {
        let products = await this.getProducts();
        const filteredProducts = products.filter(p => p.id !== id);
        if (filteredProducts.length === products.length) return false;

        await fs.writeFile(this.path, JSON.stringify(filteredProducts, null, 2));
        return true;
    }
}

const productManager = new ProductManager(path.join(__dirname, 'products.json'));

// Rutas de productos
const productRouter = express.Router();

productRouter.get('/', async (req, res) => {
    const products = await productManager.getProducts();
    res.json(products);
});

productRouter.get('/:pid', async (req, res) => {
    const product = await productManager.getProductById(parseInt(req.params.pid));
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
});

productRouter.post('/', async (req, res) => {
    const newProduct = await productManager.addProduct(req.body);
    res.status(201).json(newProduct);
});

productRouter.put('/:pid', async (req, res) => {
    const updatedProduct = await productManager.updateProduct(parseInt(req.params.pid), req.body);
    if (!updatedProduct) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(updatedProduct);
});

productRouter.delete('/:pid', async (req, res) => {
    const success = await productManager.deleteProduct(parseInt(req.params.pid));
    if (!success) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
});

app.use('/api/products', productRouter);

// Iniciamos el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});