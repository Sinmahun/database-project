
const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

const money = (value) =>
  Number(value).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

function showMessage(text, type) {
  message.textContent = text;
  message.className = type;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "เกิดข้อผิดพลาด");
  }

  return data;
}

// Load and display all products
async function loadProducts() {
  try {
    const products = await request("/api/products");

    productList.replaceChildren();


    if (products.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 6;
      cell.className = "empty";
      cell.textContent = "ยังไม่มีสินค้าในระบบ";

      row.appendChild(cell);
      productList.appendChild(row);
    }

    products.forEach((product) => {
      const row = document.createElement("tr");

      const productValue = product.price * product.quantity;



      const values = [
        product.code,
        product.name,
        `฿${money(product.price)}`,
        product.quantity.toLocaleString("th-TH"),
        `฿${money(productValue)}`
      ];

      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actionCell = document.createElement("td");
      const deleteButton = document.createElement("button");

      deleteButton.textContent = "ลบ";
      deleteButton.className = "delete";
      deleteButton.type = "button";

      deleteButton.addEventListener("click", () => {
        deleteProduct(product._id, product.name);
      });

      actionCell.appendChild(deleteButton);
      row.appendChild(actionCell);
      productList.appendChild(row);
    });

  } catch (error) {
    productList.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "empty";
    cell.textContent = "โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ MongoDB";

    row.appendChild(cell);
    productList.appendChild(row);

    showMessage(error.message, "error");
  }
}

// Add product
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitButton.disabled = true;

  const formData = new FormData(productForm);

  const product = {
    code: formData.get("code"),
    name: formData.get("name"),
    price: formData.get("price"),
    quantity: formData.get("quantity")
  };

  try {
    await request("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(product)
    });

    productForm.reset();
    showMessage("เพิ่มสินค้าสำเร็จ", "success");

    await loadProducts();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});

// Delete product
async function deleteProduct(id, name) {
  const confirmed = window.confirm(
    `คุณต้องการลบสินค้า "${name}" ใช่หรือไม่?`
  );

  if (!confirmed) return;

  try {
    await request(`/api/products/${id}`, {
      method: "DELETE"
    });

    showMessage("ลบสินค้าสำเร็จ", "success");
    await loadProducts();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

// Refresh product list
document.getElementById("refreshButton")
  .addEventListener("click", loadProducts);

// Initial load
loadProducts();
