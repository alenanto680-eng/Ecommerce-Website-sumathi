import { useEffect, useState } from 'react';
import { Search, Bell, Filter, Download, ArrowUpRight, ArrowDownRight, Calendar, MoreHorizontal, Printer } from 'lucide-react';
import '../assets/paymentmanagement.css';
import OrderInvoice from '../../pages/myorders/OrderInvoice';

const API = '/api/payment/orders';
const authHeaders = () => ({
  'Content-Type': 'application/json',
});

export default function PaymentManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [stats, setStats] = useState({ clients: 0, products: 0 });
  const [activeMetric, setActiveMetric] = useState('Revenue');
  const [allProducts, setAllProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [printingOrder, setPrintingOrder] = useState(null);

  const handlePrint = (order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      // Reset printing order after a short delay so it doesn't stay in the DOM
      setTimeout(() => setPrintingOrder(null), 1000);
    }, 500);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, statsRes, productsRes, clientsListRes] = await Promise.all([
          fetch(API, { headers: authHeaders(), credentials: 'include' }),
          fetch('/api/admin/clients/stats', { headers: authHeaders(), credentials: 'include' }),
          fetch('/api/products/admin', { headers: authHeaders(), credentials: 'include' }),
          fetch('/api/admin/clients?limit=1000', { headers: authHeaders(), credentials: 'include' })
        ]);

        const ordersData = await ordersRes.json();
        const statsData = await statsRes.json();
        const productsData = await productsRes.json();
        const clientsListData = await clientsListRes.json();

        if (ordersData.success) {
          setOrders(ordersData.data);
        }
        if (statsData.success) {
          setStats(prev => ({ ...prev, clients: statsData.stats.total }));
        }
        if (productsData.success) {
          setStats(prev => ({ ...prev, products: productsData.data.length }));
          setAllProducts(productsData.data);
        }
        if (clientsListData.success) {
          setClients(clientsListData.users);
        }

      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [selectedYear]);

  const topProducts = (() => {
    const counts = {};
    orders.filter(o => o.status === 'success' && new Date(o.createdAt).getFullYear().toString() === selectedYear).forEach(o => {
      if (!o.items) return;
      o.items.forEach(item => {
        const id = item.productId || item.id || item._id;
        if (!id) return;
        if (!counts[id]) counts[id] = 0;
        counts[id] += Number(item.qty) || 1;
      });
    });

    return Object.entries(counts)
      .map(([id, sold]) => {
        const p = allProducts.find(x => x._id === id);
        if (!p) return null;
        return {
          id,
          sold,
          name: p.name,
          img: p.img,
          category: Array.isArray(p.category) ? p.category[0] : p.category,
          subCategory: Array.isArray(p.subCategory) ? p.subCategory[0] : p.subCategory
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);
  })();

  const [selectedMonth, setSelectedMonth] = useState('All');

  const totalRev = orders.filter(o => o.status === 'success' && new Date(o.createdAt).getFullYear().toString() === selectedYear).reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getGraphData = () => {
    if (selectedMonth === 'All') {
      return monthlyLabels.map((month, i) => {
        const yearStr = selectedYear;
        const monthOrders = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getFullYear().toString() === yearStr && d.getMonth() === i;
        });
        const monthClients = clients.filter(c => {
          const d = new Date(c.createdAt);
          return d.getFullYear().toString() === yearStr && d.getMonth() === i;
        });
        const metrics = {
          Revenue: monthOrders.filter(o => o.status === 'success').reduce((acc, curr) => acc + curr.amount, 0),
          Customers: monthClients.length,
          Transactions: monthOrders.length,
          Products: stats.products
        };
        return metrics[activeMetric];
      });
    } else {
      // Daily Drilldown for selectedMonth
      const monthIdx = monthlyLabels.indexOf(selectedMonth);
      const daysInMonth = new Date(selectedYear, monthIdx + 1, 0).getDate();
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayOrders = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getFullYear().toString() === selectedYear && d.getMonth() === monthIdx && d.getDate() === day;
        });
        const dayClients = clients.filter(c => {
          const d = new Date(c.createdAt);
          return d.getFullYear().toString() === selectedYear && d.getMonth() === monthIdx && d.getDate() === day;
        });
        const metrics = {
          Revenue: dayOrders.filter(o => o.status === 'success').reduce((acc, curr) => acc + curr.amount, 0),
          Customers: dayClients.length,
          Transactions: dayOrders.length,
          Products: stats.products
        };
        return metrics[activeMetric];
      });
      return dailyData;
    }
  };

  const graphValues = getGraphData();
  const maxVal = Math.max(...graphValues, 1);
  const chartWidth = 720;
  const chartOffset = 50;
  const totalSteps = graphValues.length - 1;

  const points = graphValues.map((v, i) => ({
    x: chartOffset + (i * (chartWidth / totalSteps)),
    y: 200 - (v / maxVal * 180)
  }));

  const smoothD = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    return `${acc} C ${cp1x},${prev.y} ${cp1x},${p.y} ${p.x},${p.y}`;
  }, "");

  const areaD = `${smoothD} L ${points[points.length - 1].x},200 L ${points[0].x},200 Z`;

  const exportTransactions = () => {
    const headers = ["ID", "Client", "Transaction ID", "Amount", "Method", "Status", "Date"];
    const rows = orders.map(o => [
      o.user?.id?.slice(-6) || 'N/A',
      o.user?.name || 'Guest',
      o.paymentId || o.orderId,
      o.amount,
      'Netbanking',
      o.status,
      new Date(o.createdAt).toLocaleDateString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Transactions_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [transSearch, setTransSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // Default to empty to show all recent

  const filteredTransactions = orders.filter(o => {
    // 1. Search filter
    const searchMatch = !transSearch ||
      o.user?.id?.toLowerCase().includes(transSearch.toLowerCase()) ||
      o.paymentId?.toLowerCase().includes(transSearch.toLowerCase()) ||
      o.orderId?.toLowerCase().includes(transSearch.toLowerCase());

    // 2. Daily filter - only apply if a date is selected
    const oDate = new Date(o.createdAt).toISOString().split('T')[0];
    const dateMatch = !selectedDate || oDate === selectedDate;

    return searchMatch && dateMatch;
  });

  const stepDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <>
    <div className="dash-container">
      <h1 className="dash-main-title">Payment Dashboard</h1>
      <div className="dash-wrapper-box">
      <div className="dash-top-actions">
          <div className="dash-tools">
            <button className="dash-tool-btn" onClick={exportTransactions}><Download size={14} /> Export</button>
            <div className="dash-year-select">
              <Calendar size={14} />
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="2028">2028</option>
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Statistics Summary Bar ── */}
        <div className="dash-stats-grid">
          <div className="dash-stat-card center-card">
            <div className="dash-sc-top"><span>Total Revenue</span></div>
            <div className="dash-sc-val">₹{totalRev.toLocaleString('en-IN')}</div>
          </div>

          <div className="dash-stat-card center-card">
            <div className="dash-sc-top"><span>Total Customer</span></div>
            <div className="dash-sc-val">{stats.clients}</div>
          </div>

          <div className="dash-stat-card center-card">
            <div className="dash-sc-top"><span>Total Transaction</span></div>
            <div className="dash-sc-val">{orders.filter(o => new Date(o.createdAt).getFullYear().toString() === selectedYear).length}</div>
          </div>

          <div className="dash-stat-card center-card">
            <div className="dash-sc-top"><span>Total Products</span></div>
            <div className="dash-sc-val">{stats.products}</div>
          </div>
        </div>

        {/* ── Main Analytical Chart Card ── */}
        <div className="dash-mid-row">
          <div className="dash-analytic-card">
            <div className="dash-ac-header align-between">
              <h3>Sales Analytic</h3>
              <div className="ac-filter-group">
                <select className="ac-metric-select-dropdown matched-height-small" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                  <option value="All">All Months</option>
                  {monthlyLabels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="ac-metric-select-dropdown matched-height-small" value={activeMetric} onChange={e => setActiveMetric(e.target.value)}>
                  <option value="Revenue">Revenue</option>
                  <option value="Customers">Customers</option>
                  <option value="Transactions">Transactions</option>
                  <option value="Products">Products</option>
                </select>
              </div>
            </div>

            <div className="dash-ac-chart-area">
              <div className="ac-chart-canvas">
                <svg viewBox="0 0 820 250" className="curved-analytic-svg">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity="0.3" />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <g fill="#94A3B8" fontSize="10" fontWeight="600">
                    <text x="5" y="20">{activeMetric === 'Revenue' ? '₹' : ''}{(maxVal * 1).toLocaleString()}</text>
                    <text x="5" y="110">{activeMetric === 'Revenue' ? '₹' : ''}{(maxVal * 0.5).toLocaleString()}</text>
                    <text x="5" y="200">0</text>
                  </g>

                  {/* Grid */}
                  <line x1={chartOffset} y1="20" x2={chartOffset + chartWidth} y2="20" stroke="#f1f5f9" />
                  <line x1={chartOffset} y1="110" x2={chartOffset + chartWidth} y2="110" stroke="#f1f5f9" />
                  <line x1={chartOffset} y1="200" x2={chartOffset + chartWidth} y2="200" stroke="#1e293b" />

                  <path d={smoothD} fill="none" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
                  <path d={areaD} fill="url(#chartGradient)" />

                  <g fill="#94A3B8" fontSize="9" fontWeight="600">
                    {selectedMonth === 'All' ? (
                      monthlyLabels.map((m, i) => (
                        <text key={m} x={chartOffset + (i * (chartWidth / 11))} y="235" textAnchor={i === 0 ? "start" : i === 11 ? "end" : "middle"}>{m}</text>
                      ))
                    ) : (
                      // Show daily labels for selected month
                      Array.from({ length: graphValues.length }, (_, i) => i + 1).filter(d => d % 3 === 0 || d === 1).map((d, i, arr) => {
                        const x = chartOffset + ((d - 1) * (chartWidth / (graphValues.length - 1)));
                        return <text key={d} x={x} y="235" textAnchor="middle">{d}</text>
                      })
                    )}
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <div className="dash-top-products-card">
            <div className="dash-tp-header">
              <h3>Most Ordered Products</h3>
            </div>
            <div className="dash-tp-list">
              {topProducts.length === 0 ? (
                <div className="dash-tp-empty">No sales recorded for {selectedYear}</div>
              ) : topProducts.map((p, i) => (
                <div key={p.id} className="dash-tp-item">
                  <div className="tp-img-wrap">
                    <img src={p.img} alt={p.name} />
                  </div>
                  <div className="tp-info">
                    <div className="tp-name">{p.name}</div>
                    <div className="tp-cats">
                      {p.category} | {p.subCategory}
                    </div>
                  </div>
                  <div className="tp-count">
                    <div className="tp-count-num">{p.sold}</div>
                    <div className="tp-count-label">sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>{/* end dash-wrapper-box */}

      <div className="dash-bottom-row-full">
        <div className="dash-table-card">
          <div className="dash-cc-header align-between" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0 }}>Recent Transaction ({filteredTransactions.length})</h3>

            <div className="dash-table-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="dash-search-wrapper" style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="ID or Transaction ID..."
                  className="dash-table-search"
                  value={transSearch}
                  onChange={e => setTransSearch(e.target.value)}
                  style={{ padding: '6px 10px 6px 30px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', width: '200px' }}
                />
              </div>

              <div className="dash-date-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ border: 'none', background: 'none', fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table fixed-layout">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Client Name</th>
                  <th style={{ width: '11%', textAlign: 'center' }}>ID</th>
                  <th style={{ width: '25%', textAlign: 'center' }}>Transaction ID</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Amount</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Method</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((o, i) => (
                  <tr key={o._id}>
                    <td className="box-cell">{o.user?.name || o.userName || 'Guest User'}</td>
                    <td className="box-cell center-text"><span className="mono-text">{o.user?.id || '—'}</span></td>
                    <td className="box-cell center-text mono-text">{o.paymentId || o.orderId || 'PENDING'}</td>
                    <td className="box-cell center-text">₹{o.amount?.toLocaleString('en-IN')}</td>
                    <td className="box-cell center-text" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{o.paymentMethod || 'Razorpay'}</td>
                    <td className="box-cell center-text"><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                    <td className="box-cell center-text">
                      {o.status === 'success' ? (
                        <button 
                          className="inv-print-btn" 
                          onClick={() => handlePrint(o)}
                          title="Download Invoice"
                        >
                          <Printer size={13} /> <span>Download</span>
                        </button>
                      ) : (
                        <span className="inv-pending-text">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>No transactions found for this date.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    {printingOrder && <OrderInvoice order={printingOrder} />}
    </>
  );
}