/**
 * ALL IN ONE MART — Analytics API Server
 * Express.js REST backend for the Data Analytics Platform
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────
// Add your Netlify / GitHub Pages URL to ALLOWED_ORIGINS after deploying
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost',
  // 'https://your-site.netlify.app',   ← uncomment & paste your frontend URL
  // 'https://yourusername.github.io',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl / Postman / file://
    if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.use(express.json());

// ──────────────────────────────────────────
// DATA GENERATORS
// ──────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORIES = ['Groceries','Electronics','Fashion','Home & Living','Beauty','Sports','Books','Toys'];
const REGIONS = ['North','South','East','West','Central'];
const CHANNELS = ['Organic','Paid Search','Social','Email','Direct','Referral'];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max, dec = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}
function trend(base, month, noise = 0.08) {
  const growth = 1 + 0.015 * month;
  const seasonal = 1 + 0.12 * Math.sin((month / 12) * Math.PI * 2 - 1);
  const noiseF = 1 + (Math.random() - 0.5) * noise;
  return Math.round(base * growth * seasonal * noiseF);
}

// ── Overview KPIs ──
function getOverview() {
  return {
    kpis: {
      revenue:        { value: 2847392, prev: 2510840, unit: '$', label: 'Total Revenue' },
      orders:         { value: 48320,   prev: 43100,   unit: '',  label: 'Total Orders'  },
      activeUsers:    { value: 94701,   prev: 88200,   unit: '',  label: 'Active Users'  },
      conversionRate: { value: 3.84,    prev: 3.51,    unit: '%', label: 'Conversion Rate' },
      avgOrderValue:  { value: 58.94,   prev: 55.12,   unit: '$', label: 'Avg Order Value' },
      returnRate:     { value: 4.2,     prev: 4.8,     unit: '%', label: 'Return Rate'     }
    },
    revenueByMonth: MONTHS.map((m, i) => ({
      month: m,
      revenue:  trend(210000, i, 0.09),
      orders:   trend(3900, i, 0.07),
      visitors: trend(28000, i, 0.06),
      target:   trend(220000, i, 0.03)
    })),
    categoryBreakdown: CATEGORIES.map(cat => ({
      category: cat,
      revenue: rand(120000, 620000),
      orders:  rand(1200, 9400),
      growth:  randFloat(-5, 22)
    })),
    recentActivity: generateRecentActivity()
  };
}

// ── Sales ──
function getSalesData(period = '12m') {
  const months = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  return {
    timeline: MONTHS.slice(-months).map((m, i) => ({
      month: m,
      gross:    trend(240000, i, 0.10),
      net:      trend(195000, i, 0.10),
      refunds:  trend(9000,   i, 0.15),
      target:   trend(230000, i, 0.02)
    })),
    byRegion: REGIONS.map(r => ({
      region:  r,
      revenue: rand(300000, 800000),
      orders:  rand(3000, 12000),
      growth:  randFloat(-3, 28),
      customers: rand(5000, 22000)
    })),
    byChannel: CHANNELS.map(ch => ({
      channel:   ch,
      revenue:   rand(80000, 550000),
      orders:    rand(800, 8000),
      cac:       randFloat(4, 38),
      roas:      randFloat(1.2, 8.5),
      cvr:       randFloat(1.1, 6.9)
    })),
    funnel: [
      { stage: 'Visitors',      count: 284000 },
      { stage: 'Product Views', count: 148000 },
      { stage: 'Add to Cart',   count: 48200  },
      { stage: 'Checkout',      count: 22400  },
      { stage: 'Purchased',     count: 18320  }
    ],
    hourlyHeatmap: generateHeatmap()
  };
}

// ── Users ──
function getUsersData() {
  return {
    growth: MONTHS.map((m, i) => ({
      month:    m,
      new:      trend(7200, i, 0.11),
      returning:trend(12000, i, 0.08),
      churned:  trend(1400, i, 0.14)
    })),
    demographics: {
      age: [
        { group: '18–24', pct: 18.4 },
        { group: '25–34', pct: 34.7 },
        { group: '35–44', pct: 24.1 },
        { group: '45–54', pct: 13.8 },
        { group: '55+',   pct:  9.0 }
      ],
      device: [
        { type: 'Mobile',  pct: 62.3 },
        { type: 'Desktop', pct: 31.1 },
        { type: 'Tablet',  pct:  6.6 }
      ],
      gender: [
        { type: 'Female', pct: 54.2 },
        { type: 'Male',   pct: 43.1 },
        { type: 'Other',  pct:  2.7 }
      ]
    },
    retention: MONTHS.map((m, i) => ({
      month: m,
      d1:  randFloat(55, 75),
      d7:  randFloat(28, 48),
      d30: randFloat(14, 28),
      d90: randFloat(6, 18)
    })),
    topSegments: [
      { segment: 'High-Value Repeat',    users: 12480, ltv: '$892', churnRisk: 'Low',    avgOrders: 14.2 },
      { segment: 'New High-Intent',      users: 8720,  ltv: '$214', churnRisk: 'Medium', avgOrders: 2.1  },
      { segment: 'Lapsed (90d)',         users: 22400, ltv: '$341', churnRisk: 'High',   avgOrders: 4.8  },
      { segment: 'Occasional Shoppers',  users: 31200, ltv: '$178', churnRisk: 'Medium', avgOrders: 3.4  },
      { segment: 'Mobile-First Buyers',  users: 19800, ltv: '$456', churnRisk: 'Low',    avgOrders: 7.9  }
    ],
    sessionMetrics: {
      avgDuration:  '4m 32s',
      pagesPerSession: 6.8,
      bounceRate:   38.4,
      exitRate:     24.1
    }
  };
}

// ── Products ──
function getProductsData() {
  const products = [
    'Wireless Earbuds Pro','Organic Food Bundle','Running Shoes X3',
    'Smart Home Hub','Vitamin C Serum','Yoga Mat Premium',
    'Novel: The Last Light','LEGO City Builder','Coffee Maker Deluxe',
    'Laptop Stand Aluminum','Resistance Band Set','Travel Backpack 40L',
    'Air Purifier 500','Skincare Starter Kit','Board Game: Catan'
  ];
  return {
    topProducts: products.map(name => ({
      name,
      category: CATEGORIES[rand(0, CATEGORIES.length - 1)],
      revenue:  rand(18000, 180000),
      units:    rand(200, 4800),
      margin:   randFloat(12, 64),
      rating:   randFloat(3.4, 5.0, 1),
      reviews:  rand(48, 2800),
      stock:    rand(0, 1200),
      trend:    randFloat(-12, 35)
    })).sort((a, b) => b.revenue - a.revenue),
    inventory: CATEGORIES.map(cat => ({
      category: cat,
      inStock:  rand(800, 5000),
      lowStock: rand(20, 180),
      outStock: rand(2, 40),
      value:    rand(80000, 600000)
    })),
    performance: MONTHS.map((m, i) => ({
      month: m,
      newListings: rand(40, 140),
      discontinued: rand(4, 28),
      avgRating: randFloat(4.0, 4.8, 2)
    }))
  };
}

// ── Orders ──
function getOrders(page = 1, limit = 20, status = null) {
  const statuses = ['Completed','Processing','Shipped','Cancelled','Refunded'];
  const names = ['Priya S.','Raj M.','Emily C.','Liam T.','Fatima K.',
                 'Carlos D.','Sarah B.','Ahmed H.','Lin Z.','Nina P.',
                 'Oscar V.','Grace N.','Ivan R.','Maya W.','Tom F.'];
  const total = 240;
  const all = Array.from({ length: total }, (_, k) => {
    const s = statuses[rand(0, 4)];
    return {
      id:       `ORD-${100000 + k}`,
      customer: names[rand(0, names.length - 1)],
      category: CATEGORIES[rand(0, CATEGORIES.length - 1)],
      amount:   randFloat(12, 480),
      status:   s,
      date:     new Date(Date.now() - rand(0, 7776000000)).toISOString().split('T')[0],
      items:    rand(1, 8),
      region:   REGIONS[rand(0, REGIONS.length - 1)]
    };
  });
  const filtered = status ? all.filter(o => o.status === status) : all;
  const start    = (page - 1) * limit;
  return {
    orders:     filtered.slice(start, start + limit),
    total:      filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
    summary: {
      completed:  all.filter(o => o.status === 'Completed').length,
      processing: all.filter(o => o.status === 'Processing').length,
      shipped:    all.filter(o => o.status === 'Shipped').length,
      cancelled:  all.filter(o => o.status === 'Cancelled').length,
      refunded:   all.filter(o => o.status === 'Refunded').length
    }
  };
}

// ── Reports ──
function getReports() {
  return {
    available: [
      { id: 'r1', name: 'Monthly Revenue Summary',    type: 'Financial', size: '284 KB', generated: '2025-01-20', format: 'PDF' },
      { id: 'r2', name: 'User Acquisition Report',    type: 'Marketing', size: '196 KB', generated: '2025-01-19', format: 'CSV' },
      { id: 'r3', name: 'Inventory Status Q4',        type: 'Operations', size: '512 KB', generated: '2025-01-15', format: 'XLSX'},
      { id: 'r4', name: 'Sales by Category 2024',     type: 'Sales',     size: '340 KB', generated: '2025-01-10', format: 'PDF' },
      { id: 'r5', name: 'Customer Retention Analysis',type: 'CRM',       size: '228 KB', generated: '2025-01-08', format: 'PDF' },
      { id: 'r6', name: 'Channel Performance Q4',     type: 'Marketing', size: '178 KB', generated: '2025-01-05', format: 'CSV' }
    ],
    scheduled: [
      { name: 'Weekly Sales Digest',   frequency: 'Weekly',  nextRun: 'Every Monday 08:00', recipients: 4 },
      { name: 'Monthly KPI Dashboard', frequency: 'Monthly', nextRun: 'Feb 1 09:00',        recipients: 8 },
      { name: 'Inventory Alert',       frequency: 'Daily',   nextRun: 'Tomorrow 06:00',     recipients: 2 }
    ]
  };
}

function generateRecentActivity() {
  const types  = ['order','refund','user_signup','review','low_stock'];
  const labels = {
    order:       'New order placed',
    refund:      'Refund requested',
    user_signup: 'New user registered',
    review:      'Product reviewed',
    low_stock:   'Low stock alert'
  };
  return Array.from({ length: 10 }, (_, i) => {
    const t = types[rand(0, types.length - 1)];
    return {
      id:   i + 1,
      type: t,
      label: labels[t],
      value: t === 'order' ? `$${randFloat(20, 300)}` : null,
      time:  `${rand(1, 59)}m ago`
    };
  });
}

function generateHeatmap() {
  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return days.map(day => ({
    day,
    hours: hours.map(h => ({
      hour:   h,
      orders: rand(0, h > 9 && h < 22 ? 220 : 30)
    }))
  }));
}

// ──────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Overview
app.get('/api/overview', (req, res) => {
  res.json(getOverview());
});

// Sales
app.get('/api/sales', (req, res) => {
  const { period } = req.query;
  res.json(getSalesData(period));
});

// Users
app.get('/api/users', (req, res) => {
  res.json(getUsersData());
});

// Products
app.get('/api/products', (req, res) => {
  res.json(getProductsData());
});

// Orders — paginated & filterable
app.get('/api/orders', (req, res) => {
  const page   = parseInt(req.query.page)   || 1;
  const limit  = parseInt(req.query.limit)  || 20;
  const status = req.query.status           || null;
  res.json(getOrders(page, limit, status));
});

app.get('/api/orders/:id', (req, res) => {
  res.json({
    id:       req.params.id,
    customer: 'Priya S.',
    email:    'priya@example.com',
    phone:    '+91 98765 43210',
    status:   'Completed',
    date:     new Date().toISOString().split('T')[0],
    amount:   randFloat(50, 400),
    items: [
      { name: 'Wireless Earbuds Pro', qty: 1, price: 79.99 },
      { name: 'Laptop Stand',         qty: 1, price: 34.99 }
    ],
    shippingAddress: '42 Marine Lines, Mumbai 400002',
    paymentMethod:   'UPI',
    timeline: [
      { event: 'Order Placed',    time: '2025-01-20 10:14' },
      { event: 'Payment Verified',time: '2025-01-20 10:15' },
      { event: 'Packed',          time: '2025-01-20 14:30' },
      { event: 'Shipped',         time: '2025-01-21 09:00' },
      { event: 'Delivered',       time: '2025-01-22 15:45' }
    ]
  });
});

// Reports
app.get('/api/reports', (req, res) => {
  res.json(getReports());
});

// Analytics summary (for widgets)
app.get('/api/analytics/summary', (req, res) => {
  res.json({
    today: {
      revenue: rand(6000, 14000),
      orders:  rand(80, 240),
      visitors:rand(900, 2400),
      newUsers:rand(40, 180)
    },
    alerts: [
      { type: 'warning', message: '3 products are low on stock' },
      { type: 'info',    message: 'February report ready to download' },
      { type: 'success', message: 'Revenue target hit 3 days early' }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Analytics API running on http://localhost:${PORT}`);
  console.log(`📊  Endpoints:`);
  console.log(`    GET /api/overview`);
  console.log(`    GET /api/sales?period=12m`);
  console.log(`    GET /api/users`);
  console.log(`    GET /api/products`);
  console.log(`    GET /api/orders?page=1&limit=20&status=`);
  console.log(`    GET /api/reports`);
  console.log(`    GET /api/analytics/summary\n`);
});

module.exports = app;
