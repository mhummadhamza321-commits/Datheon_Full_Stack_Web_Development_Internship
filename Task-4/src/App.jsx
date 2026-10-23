
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "https://fakestoreapi.com/products";
const TAX_RATE = 0.08;
const FREE_SHIPPING_LIMIT = 100;
const SHIPPING_FEE = 8;

const categories = [
  { label: "All Products", value: "all" },
  { label: "Electronics", value: "electronics" },
  { label: "Jewelry", value: "jewelery" },
  { label: "Clothing", value: "clothing" },
];

function getCategory(category) {
  if (category === "electronics") return "electronics";
  if (category === "jewelery") return "jewelery";
  return "clothing";
}

function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

function readSavedCart() {
  try {
    const saved = localStorage.getItem("task4-cart");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function Navbar({ cartCount, onOpenCart }) {
  return (
    <header className="navbar">
      <a className="brand" href="#home" aria-label="Shoply home">
        <span className="brand-icon">S</span>
        shoply<span className="brand-dot">.</span>
      </a>

      <span className="nav-message">Thoughtful finds. Better shopping.</span>

      <button
        className="cart-button"
        onClick={onOpenCart}
        aria-label={`Open shopping cart, ${cartCount} items`}
      >
        <span aria-hidden="true">🛍</span>
        <span>Cart</span>
        <span className="cart-count">{cartCount}</span>
      </button>
    </header>
  );
}

function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <span className="product-badge">
          {product.rating?.rate >= 4.5 ? "Top rated" : "Featured"}
        </span>
        <img
          className="product-image"
          src={product.image}
          alt={product.title}
          loading="lazy"
        />
      </div>

      <div className="product-info">
        <span className="product-category">
          {product.category}
        </span>
        <h3 title={product.title}>{product.title}</h3>

        <div className="product-rating">
          <span aria-label={`${product.rating?.rate ?? 0} out of 5 stars`}>
            ★ {product.rating?.rate ?? "N/A"}
          </span>
          <span className="rating-count">
            ({product.rating?.count ?? 0} reviews)
          </span>
        </div>

        <div className="product-card-bottom">
          <span className="product-price">
            {formatPrice(product.price)}
          </span>
          <button
            className={`add-button ${added ? "added" : ""}`}
            onClick={handleAdd}
          >
            {added ? "Added ✓" : "+ Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  open,
  cart,
  subtotal,
  tax,
  shipping,
  total,
  onClose,
  onQuantityChange,
  onRemove,
  onCheckout,
}) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-overlay" onMouseDown={onClose}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">YOUR SELECTION</p>
            <h2 id="cart-title">Shopping cart</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <span className="empty-cart-icon">🛍️</span>
              <h3>Your cart is waiting</h3>
              <p>Add something you love to get started.</p>
              <button className="primary-button" onClick={onClose}>
                Explore products
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.title} />
                <div className="cart-item-details">
                  <h3>{item.title}</h3>
                  <strong>{formatPrice(item.price)}</strong>

                  <div className="quantity-row">
                    <div
                      className="quantity-control"
                      aria-label={`Quantity for ${item.title}`}
                    >
                      <button
                        onClick={() =>
                          onQuantityChange(item.id, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          onQuantityChange(item.id, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-button"
                      onClick={() => onRemove(item.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <p className="line-total">
                    Item total: {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-summary">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-line">
              <span>Tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            <p className="shipping-note">
              {shipping > 0
                ? `Spend ${formatPrice(FREE_SHIPPING_LIMIT - subtotal)} more for free shipping.`
                : "You unlocked free shipping!"}
            </p>
            <div className="summary-total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button className="checkout-button" onClick={onCheckout}>
              Continue to checkout →
            </button>
            <p className="demo-note">
              Demo checkout only. No real payment is collected.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function CheckoutModal({ open, total, onClose, onConfirm }) {
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!open) {
      setCustomerName("");
      setEmail("");
      setAddress("");
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    onConfirm({ customerName, email, address });
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section
        className="checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">ALMOST THERE</p>
            <h2 id="checkout-title">Complete your order</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close checkout">
            ✕
          </button>
        </div>

        <p className="checkout-total">
          Order total <strong>{formatPrice(total)}</strong>
        </p>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              required
              minLength={2}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Your full name"
            />
          </label>

          <label>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Delivery address
            <textarea
              required
              minLength={5}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Street, city, postal code"
              rows={3}
            />
          </label>

          <button className="checkout-button" type="submit">
            Place demo order · {formatPrice(total)}
          </button>
          <p className="demo-note">
            This is a simulated checkout. Do not enter sensitive information.
          </p>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState(readSavedCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load products. Please try again.");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("task4-cart", JSON.stringify(cart));
    } catch {
      // The cart still works for the current session if storage is unavailable.
    }
  }, [cart]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        category === "all" ||
        (category === "clothing"
          ? product.category === "men's clothing" ||
          product.category === "women's clothing"
          : getCategory(product.category) === category);

      return matchesSearch && matchesCategory;
    });

    if (sort === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      result = [...result].sort(
        (a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0)
      );
    }

    return result;
  }, [products, search, category, sort]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const tax = subtotal * TAX_RATE;
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_FEE;
  const total = subtotal + tax + shipping;

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function placeOrder(customer) {
    const order = {
      ...customer,
      orderNumber: `SH-${Date.now().toString().slice(-8)}`,
      total,
      items: cart.map((item) => ({ ...item })),
      date: new Date().toLocaleString(),
    };

    setConfirmation(order);
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
  }

  return (
    <div id="home" className="app-shell">
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-label">
              <span className="status-dot" /> THE EVERYDAY EDIT
            </span>
            <h1>Good finds.<br />Great <span>feelings.</span></h1>
            <p>
              Discover everyday essentials and standout pieces,
              all in one thoughtful collection.
            </p>
            <a className="hero-button" href="#products">
              Explore the collection <span>↓</span>
            </a>
            <div className="hero-proof">
              <span>✦ Carefully selected finds</span>
              <span>✦ Simple, secure demo checkout</span>
            </div>
          </div>

          <div className="hero-art" aria-label="Shopping collection illustration">
            <div className="art-circle circle-one" />
            <div className="art-circle circle-two" />
            <div className="art-card art-card-back">
              <span>THE</span>
              <strong>EDIT</strong>
              <small>EVERYDAY GOODS</small>
            </div>
            <div className="art-bag">
              <div className="bag-handle" />
              <div className="bag-logo">S.</div>
              <div className="bag-label">GOOD THINGS<br />INSIDE</div>
            </div>
            <div className="art-sticker">FIND<br />YOUR<br />FAVORITE <span>✳</span></div>
            <div className="art-caption">A LITTLE SOMETHING<br />FOR EVERY DAY.</div>
          </div>
        </section>

        <section id="products" className="catalog-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CURATED FOR YOU</p>
              <h2>Explore the collection<span>.</span></h2>
              <p className="section-description">
                Everyday favorites, ready to find a new home.
              </p>
            </div>
            <span className="result-count">
              {loading ? "Loading..." : `${filteredProducts.length} products`}
            </span>
          </div>

          <div className="catalog-controls">
            <div className="category-tabs" aria-label="Product categories">
              {categories.map((item) => (
                <button
                  key={item.value}
                  className={category === item.value ? "category-tab active" : "category-tab"}
                  onClick={() => setCategory(item.value)}
                  aria-pressed={category === item.value}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="catalog-tools">
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products"
                />
              </label>

              <select
                className="sort-select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="status-message" role="status">
              <span className="spinner" />
              <p>Finding your next favorite...</p>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              <h3>We couldn't load the collection.</h3>
              <p>{error}</p>
              <button className="primary-button" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="empty-results">
              <span>⌕</span>
              <h3>No products found</h3>
              <p>Try another search or choose a different category.</p>
              <button
                className="primary-button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </section>

        <section className="bottom-banner">
          <span className="banner-sparkle">✳</span>
          <div>
            <p className="eyebrow">A GOOD PLACE TO START</p>
            <h2>Find the little things that make your day.</h2>
          </div>
          <a href="#products">Shop the edit ↗</a>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">S</span>
          shoply<span className="brand-dot">.</span>
        </a>
        <p>Built with React · Vite · FakeStoreAPI</p>
        <p>Internship Task 4 · Demo storefront</p>
      </footer>

      <CartDrawer
        open={cartOpen}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        shipping={shipping}
        total={total}
        onClose={() => setCartOpen(false)}
        onQuantityChange={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        total={total}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={placeOrder}
      />

      {confirmation && (
        <div className="modal-overlay confirmation-overlay">
          <section
            className="confirmation-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
          >
            <div className="success-icon">✓</div>
            <p className="eyebrow">ORDER PLACED</p>
            <h2 id="confirmation-title">You're all set!</h2>
            <p>
              Thanks, {confirmation.customerName}. Your demo order has
              been created successfully.
            </p>
            <div className="order-details">
              <span>Order number</span>
              <strong>{confirmation.orderNumber}</strong>
              <span>Order total</span>
              <strong>{formatPrice(confirmation.total)}</strong>
              <span>Items</span>
              <strong>
                {confirmation.items.reduce((sum, item) => sum + item.quantity, 0)}
              </strong>
            </div>
            <p className="demo-note">
              This confirmation is local to this demo. No payment was taken
              and no order was sent to a server.
            </p>
            <button
              className="checkout-button"
              onClick={() => setConfirmation(null)}
            >
              Continue shopping
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
