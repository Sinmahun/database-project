
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Connect MongoDB
mongoose
  .connect("mongodb://localhost:27017/stock_db")
  .then(async () => {
    console.log("Connected to MongoDB");

    // Create sample products if collection is empty
    const count = await Product.countDocuments();

    if (count === 0) {
      await Product.insertMany([
        {
          code: "P001",
          name: "Keyboard",
          price: 590,
          quantity: 10
        },
        {
          code: "P002",
          name: "Mouse",
          price: 290,
          quantity: 20
        }
      ]);

      console.log("Sample products created");
    }

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// Product Schema
const productSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer"
      }
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);

// GET: Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch products" });
  }
});

// POST: Add a new product
app.post("/api/products", async (req, res) => {
  try {
    const { code, name, price, quantity } = req.body;

    if (
      typeof code !== "string" ||
      typeof name !== "string" ||
      !code.trim() ||
      !name.trim() ||
      String(price).trim() === "" ||
      String(quantity).trim() === "" ||
      !Number.isFinite(Number(price)) ||
      !Number.isInteger(Number(quantity)) ||
      Number(price) < 0 ||
      Number(quantity) < 0
    ) {
      return res.status(400).json({
        message: "Please enter valid product information"
      });
    }

    const product = await Product.create({
      code: code.trim(),
      name: name.trim(),
      price: Number(price),
      quantity: Number(quantity)
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Product code already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(500).json({ message: "Cannot add product" });
  }
});

// DELETE: Delete a product
app.delete("/api/products/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Cannot delete product" });
  }
});
