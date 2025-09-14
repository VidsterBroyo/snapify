import { useState } from 'react';
import axios from 'axios';
import './App.css';

function Furniture({ product, onDragStart }) {
  const productUrl = `https://shop.app/products/${product.handle || product.id}`;

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(product);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", product.id);
      }}
      className="w-24 relative cursor-grab group overflow-visible"
    >
      {/* Image */}
      <img
        src={product.images.edges[0]?.node.url}
        alt={product.title}
        className="w-full h-24 object-cover rounded-lg"
      />

      {/* Hover tooltip */}
      <div className="absolute bg-black -top-15 -right-28 z-10 p-2 hidden group-hover:block border border-white">
        <div className="bg-black text-white text-l px-2 rounded-lg shadow-lg whitespace-nowrap">
          <p>
            {product.title}
          </p>
        </div>
        <div className='flex px-2'>
          <a href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline">Product Link
          </a>
          <img src="https://i.postimg.cc/X7ghMy8N/image-removebg-preview.png" className="h-6"></img>
        </div>
      </div>
    </div>
  );
}

function GridSlot({ x, y, furniture, onDrop, onDragStart }) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(x, y)}
      className={`aspect-square border border-gray-500 flex items-center justify-center ${
        furniture ? '' : 'bg-black'
      }`}
    >
      {furniture && (
        <div
          draggable
          onDragStart={(e) => {
            onDragStart(furniture, x, y);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', furniture.id);
          }}
          className="w-full h-full"
        >
          <img
            src={furniture.images.edges[0]?.node.url}
            alt={furniture.title}
            className="w-full h-full object-cover rounded"
          />
        </div>
      )}
    </div>
  );
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const shops = [
    "highfashionhome",
    "furnituremaxi",
    "thronekingdom",
    "chicoryhome",
    "furnitureofcanada",
    "furniturebarn",
    "thegoatwallart",
    "ruggable",
    "consciousitems",
  ];

  const [grid, setGrid] = useState(Array.from({ length: 8 }, () => Array(8).fill(null)));
  const [draggingProduct, setDraggingProduct] = useState(null);
  const [draggingFromGrid, setDraggingFromGrid] = useState(null); // track grid source

  const handleDragStart = (product, x = null, y = null) => {
    setDraggingProduct(product);
    if (x !== null && y !== null) setDraggingFromGrid({ x, y });
  };

  const handleDrop = async (x, y) => {
    if (!draggingProduct) return;

    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      newGrid[y][x] = draggingProduct;

      // If dragging from grid, remove original
      if (draggingFromGrid) {
        newGrid[draggingFromGrid.y][draggingFromGrid.x] = null;
      }

      // Send the updated grid to backend
      updateBackendGrid(newGrid);

      return newGrid;
    });

    // If dragging from inventory, remove from inventory
    if (!draggingFromGrid) {
      setProducts((prev) => prev.filter((p) => p.id !== draggingProduct.id));
    }

    setDraggingProduct(null);
    setDraggingFromGrid(null);
  };

  const updateBackendGrid = async (gridState) => {
    try {
      // Transform the grid into a serializable format
      const serializedGrid = gridState.map(row =>
        row.map(cell => (cell ? { id: cell.id, title: cell.title } : null))
      );

      await axios.post('http://localhost:4000/api/update-grid', { grid: serializedGrid });
      console.log('Backend grid updated!');
    } catch (err) {
      console.error('Failed to update backend grid:', err);
    }
  };

  const fetchShopifyProducts = async (prompt) => {
    const allProducts = [];
    await Promise.all(
      shops.map(async (shop) => {
        const url = `https://${shop}.myshopify.com/api/2025-07/graphql.json`;
        const query = `{
          products(first: 10, query: "${prompt}") {
            edges {
              node {
                id
                title
                description
                productType
                images(first: 1) {
                  edges {
                    node { url }
                  }
                }
              }
            }
          }
        }`;
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          const data = await res.json();
          const shopProducts = data.data.products.edges.map((e) => e.node);
          allProducts.push(...shopProducts);
        } catch (err) {
          console.error(`Error fetching from ${shop}:`, err);
        }
      })
    );
    console.log(allProducts)
    return allProducts;
  };

  const getRecommendedProductIds = async (allProducts, userPrompt) => {
    try {
      const { data } = await axios.post('http://localhost:4000/api/recommend', {
        products: allProducts,
        prompt: userPrompt,
      });
      console.log(data.recommendedIds)
      return data.recommendedIds || [];
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);

    // Reset grid locally
    const emptyGrid = Array.from({ length: 8 }, () => Array(8).fill(null));
    setGrid(emptyGrid);
    setProducts([]);

    // Reset grid on backend
    await updateBackendGrid(emptyGrid);

    const allProducts = await fetchShopifyProducts(prompt);
    const recommendedIds = await getRecommendedProductIds(allProducts, prompt);

    let filteredProducts = allProducts.filter((p) =>
      recommendedIds.includes(p.id.split('/').pop())
    );

    // --- Hardcoded product ---
    const extraProduct = {
        "id": "7198596628549",
        "title": "Avery Velvet Reversible Corner Sofa Bed With Storage Chaise",
        "description": "The Essential Velvet Reversible Corner Sofa Bed with Storage Chaise is more than just a piece of furniture; it's a versatile solution that adapts to your lifestyle. Whether you're looking to maximize your space with functional furniture or elevate your home decor with a touch of velvet luxury, this sofa bed is designed to meet your needs. Effortlessly transform the sofa into a bed within seconds. Whether accommodating overnight guests or enjoying a lazy weekend at home, this feature offers the ultimate convenience. Practicality meets style with the built-in storage chaise. Perfect for organizing living room essentials, the storage space ensures that your living area remains clutter-free while keeping your necessities within easy reach. Wrap yourself in the plush, soft touch of premium velvet, providing both an indulgent feel and a splash of opulence to your interior decor. At its core, the Essential sofa boasts a sturdy wooden frame that ensures longevity and durability. Colour: Choose from Mustard/Dark Blue/ Grey/Beige Decorations and scatter pillows are not included 👈👉 Lefty or Righty? Versatile Set has got you covered, you can put either right hand side or left hand side",
        "productType": "Sofas & Armchairs",
        "images": {
            "edges": [
                {
                    "node": {
                        "url": "https://cdn.shopify.com/s/files/1/1618/6251/files/thumbnail_f950ee6a-dc28-40d7-a5f1-5b15d583843a.jpg?v=1748439245"
                    }
                }
            ]
        }
    }

    if (!filteredProducts.some(p => p.id === extraProduct.id)) {
      console.log("hardcode")
      filteredProducts.push(extraProduct);
    }

    //Normalize ids
    filteredProducts = filteredProducts.map((p) => ({
      ...p,
      id: p.id.split("/").pop(),
    }));


    setProducts(filteredProducts);
    setPrompt('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-neutral-900 to-neutral-800 [background-image:radial-gradient(circle_at_top_left,#1e1e1e,transparent_40%)]">
      <div className="max-w-3xl w-full flex flex-col items-center gap-6">
        <img src="https://i.postimg.cc/ncM7xyKs/image-removebg-preview-2.png" className="h-32"></img>
        <div className="text-center">
          <h1 className="inline-block leading-tight text-7xl font-semibold mb-2 bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#93C5FD] bg-clip-text text-transparent">Snapify</h1>
          <p className="mt-4 text-2xl text-chat-placeholder font-normal">How can I help you today?</p>
        </div>

        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end bg-chat-input border border-chat-border rounded-3xl p-3 transition-all duration-200 focus-within:border-chat-primary focus-within:shadow-[0_0_0_2px_rgba(16,163,127,0.1)]">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What vibe are you feeling ?"
                className="flex-1 bg-transparent border-none outline-none text-chat-text text-base leading-6 resize-none min-h-32 max-h-48 font-inherit placeholder-chat-placeholder"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                className={`ml-2 w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${
                  prompt.trim() ? 'bg-chat-primary hover:bg-chat-primary-hover cursor-pointer' : 'bg-chat-border cursor-not-allowed'
                }`}
                disabled={!prompt.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inventory */}
      <h1 className={`mb-0 text-2xl font-bold ${products.length == 0 ? 'hidden' : 'visible'}`}>Inventory</h1>
      <div className="w-8/10 flex flex-wrap gap-2 justify-center mt-4">
        {products.map((product) => (
          <Furniture key={product.id} product={product} onDragStart={handleDragStart} />
        ))}
      </div>

      {/* Room Grid */}
      <h1 className="mb-0 text-2xl font-bold">Room Layout</h1>
      <div className="w-full max-w-xl grid grid-cols-8 gap-1 mt-3 p-1 border-2 border-white rounded-xl">
        {grid.map((row, y) =>
          row.map((slot, x) => (
            <GridSlot
              key={`${x}-${y}`}
              x={x}
              y={y}
              furniture={slot}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
