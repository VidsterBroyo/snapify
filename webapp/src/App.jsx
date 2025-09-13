import { useState } from 'react';
import axios from 'axios';
import './App.css';

function Furniture({ product, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(product);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', product.id);
      }}
      className="w-24 flex flex-col items-center cursor-grab"
    >
      <img
        src={product.images.edges[0]?.node.url}
        alt={product.title}
        className="w-full h-24 object-cover rounded-lg"
      />
      <p className="text-center mt-1 text-white text-sm">{product.title}</p>
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

    const filteredProducts = allProducts.filter((p) =>
      recommendedIds.includes(p.id.split('/').pop())
    );

    setProducts(filteredProducts);
    setPrompt('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-neutral-900 to-neutral-800 [background-image:radial-gradient(circle_at_top_left,#1e1e1e,transparent_40%)]">
      <div className="max-w-3xl w-full flex flex-col items-center gap-12">
        <div className="text-center">
          <h1 className="text-7xl font-semibold mb-2 bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#93C5FD] bg-clip-text text-transparent">Snapify</h1>
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
      <div className="w-8/10 flex flex-wrap gap-2 justify-center mt-4">
        {products.map((product) => (
          <Furniture key={product.id} product={product} onDragStart={handleDragStart} />
        ))}
      </div>

      {/* Room Grid */}
      <div className="w-full max-w-4xl grid grid-cols-8 gap-1 mt-8 p-1 border-2 border-white rounded-xl">
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
