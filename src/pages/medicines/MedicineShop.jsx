import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import './MedicineShop.css';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const date = value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function MedicineShop() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState('shop');
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const catalog = await api.get('/shop/medicines');
      setMedicines(catalog.medicines || []);
      setCategories(catalog.categories || []);
      try {
        const savedCart = await api.get('/shop/cart');
        setCart(savedCart.cart || { items: [] });
      } catch (cartError) {
        setError(cartError.message || 'Sign in to use your cart.');
      }
    } catch (requestError) {
      setError(requestError.message === 'Not authenticated' ? 'Please sign in to browse the medicine shop.' : requestError.message || 'Unable to load the medicine shop.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => medicines.filter(item => (!category || item.category === category) && (!query || `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()))), [medicines, query, category]);
  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.items.reduce((total, item) => total + item.quantity * (item.medicine?.price || 0), 0);

  const updateCart = async (path, options, successMessage = '') => {
    setBusy(true); setError('');
    try { const response = await api[path.method](path.url, options); setCart(response.cart); setMessage(successMessage); }
    catch (requestError) { setError(requestError.message || 'Cart update failed.'); }
    finally { setBusy(false); }
  };

  const addToCart = (medicineId, quantity = 1) => updateCart({ method: 'post', url: '/shop/cart/items' }, { medicineId, quantity }, 'Added to your cart.');
  const changeQuantity = (medicineId, quantity) => updateCart({ method: 'patch', url: `/shop/cart/items/${medicineId}` }, { quantity });
  const removeItem = medicineId => updateCart({ method: 'remove', url: `/shop/cart/items/${medicineId}` }, undefined, 'Item removed.');

  const checkout = async () => {
    setBusy(true); setError('');
    try { await api.post('/shop/orders'); setCart({ items: [] }); setCartOpen(false); setView('orders'); setMessage('Order placed successfully.'); const response = await api.get('/shop/orders'); setOrders(response.orders || []); }
    catch (requestError) { setError(requestError.message || 'Unable to place order.'); }
    finally { setBusy(false); }
  };

  const showOrders = async () => {
    setView('orders'); setError('');
    try { const response = await api.get('/shop/orders'); setOrders(response.orders || []); }
    catch (requestError) { setError(requestError.message || 'Unable to load order history.'); }
  };

  return <section className="page shop-page">
    <div className="shop-heading page-heading">
      <div><p className="eyebrow">HEALTHBOOK PHARMACY</p><h1>Medicine shop</h1><p>Everyday essentials, clearly sourced and delivered with care.</p></div>
      <div className="shop-actions"><button className={`shop-tab ${view === 'shop' ? 'selected' : ''}`} onClick={() => setView('shop')}>Browse shop</button><button className={`shop-tab ${view === 'orders' ? 'selected' : ''}`} onClick={showOrders}>Order history</button><button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Open cart">Cart <b>{cartCount}</b></button></div>
    </div>
    {message && <p className="shop-success">{message}</p>}{error && <p className="form-error">{error}</p>}
    {view === 'orders' ? <OrderHistory orders={orders} /> : <>
      <div className="shop-toolbar"><label className="shop-search">⌕<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by medicine or category" /></label><select value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
      {loading ? <div className="empty-state"><span>...</span><h2>Preparing the pharmacy...</h2></div> : filtered.length === 0 ? <div className="empty-state"><span>⌕</span><h2>No medicines found</h2><p>Try another name or category.</p></div> : <div className="shop-grid">{filtered.map(medicine => <article className="shop-product" key={medicine._id}><button className="product-image" onClick={() => setSelected(medicine)}><img src={medicine.image} alt="" /><span>+</span></button><div className="product-copy"><small>{medicine.category}</small><h2>{medicine.name}</h2><p>{medicine.manufacturer}</p><strong>{money(medicine.price)}</strong><span className={medicine.stock ? 'in-stock' : 'out-stock'}>{medicine.stock ? `${medicine.stock} in stock` : 'Out of stock'}</span></div><button className="btn btn-primary product-add" disabled={!medicine.stock || busy} onClick={() => addToCart(medicine._id)}>Add to cart</button></article>)}</div>}
    </>}
    {selected && <ProductDetail medicine={selected} onClose={() => setSelected(null)} onAdd={() => { addToCart(selected._id); setSelected(null); }} busy={busy} />}
    {cartOpen && <CartPanel cart={cart} total={cartTotal} busy={busy} onClose={() => setCartOpen(false)} onChange={changeQuantity} onRemove={removeItem} onCheckout={checkout} />}
  </section>;
}

function ProductDetail({ medicine, onClose, onAdd, busy }) { return <div className="shop-overlay" onClick={onClose}><div className="product-detail" onClick={event => event.stopPropagation()}><button className="close-button" onClick={onClose}>×</button><div className="detail-image"><img src={medicine.image} alt="" /></div><div><small>{medicine.category}</small><h2>{medicine.name}</h2><p className="detail-manufacturer">Made by {medicine.manufacturer}</p><strong className="detail-price">{money(medicine.price)}</strong><p>{medicine.description}</p><dl><div><dt>Stock</dt><dd>{medicine.stock} available</dd></div><div><dt>Prescription</dt><dd>{medicine.prescriptionRequired ? 'Required' : 'Not required'}</dd></div></dl><button className="btn btn-primary" disabled={!medicine.stock || busy} onClick={onAdd}>{medicine.stock ? 'Add to cart' : 'Out of stock'}</button></div></div></div> }

function CartPanel({ cart, total, busy, onClose, onChange, onRemove, onCheckout }) { return <div className="shop-overlay cart-overlay" onClick={onClose}><aside className="cart-panel" onClick={event => event.stopPropagation()}><div className="cart-header"><div><p className="eyebrow">YOUR ORDER</p><h2>Shopping cart</h2></div><button className="close-button" onClick={onClose}>×</button></div>{cart.items.length === 0 ? <div className="empty-state"><span>□</span><h2>Your cart is empty</h2><p>Add something useful for your care routine.</p></div> : <><div className="cart-items">{cart.items.map(item => <div className="cart-item" key={item.medicine._id}><img src={item.medicine.image} alt="" /><div><strong>{item.medicine.name}</strong><small>{money(item.medicine.price)} each</small><div className="quantity"><button disabled={busy} onClick={() => item.quantity === 1 ? onRemove(item.medicine._id) : onChange(item.medicine._id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button disabled={busy || item.quantity >= item.medicine.stock} onClick={() => onChange(item.medicine._id, item.quantity + 1)}>+</button><button className="remove-link" onClick={() => onRemove(item.medicine._id)}>Remove</button></div></div></div>)}</div><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="btn btn-primary full" disabled={busy} onClick={onCheckout}>{busy ? 'Processing...' : 'Place order'}</button></>}</aside></div> }

function OrderHistory({ orders }) { return <div className="orders-view"><div className="section-title"><h2>Your orders</h2><span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>{orders.length === 0 ? <div className="empty-state"><span>□</span><h2>No orders yet</h2><p>Your completed purchases will appear here.</p></div> : <div className="orders-list">{orders.map(order => <article className="order-card" key={order._id}><div><small>{date(order.createdAt)}</small><h3>Order #{order._id.slice(-6).toUpperCase()}</h3></div><span className="order-status">{order.status}</span><strong>{money(order.totalAmount)}</strong><div className="order-items">{order.items.map(item => <span key={`${order._id}-${item.name}`}>{item.name} × {item.quantity}</span>)}</div></article>)}</div>}</div> }
