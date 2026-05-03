import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  FaChartLine, FaUsers, FaDollarSign, FaTrophy, 
  FaArrowUp, FaArrowDown, FaBrain, FaCalendarCheck,
  FaChartPie, FaRobot, FaBolt 
} from 'react-icons/fa';
import '../../styles/AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [predictions, setPredictions] = useState(null);

  // Sample data - in production, fetch from API
  const revenueData = [
    { month: 'Jan', revenue: 12400, predicted: 13000, students: 85 },
    { month: 'Feb', revenue: 14200, predicted: 14500, students: 92 },
    { month: 'Mar', revenue: 15800, predicted: 16200, students: 98 },
    { month: 'Apr', revenue: 17500, predicted: 17800, students: 105 },
    { month: 'May', revenue: 19200, predicted: 19500, students: 112 },
    { month: 'Jun', revenue: 21000, predicted: 21500, students: 120 },
  ];

  const classPopularity = [
    { name: 'Hip-Hop', value: 35, color: '#667eea' },
    { name: 'Ballet', value: 25, color: '#764ba2' },
    { name: 'Contemporary', value: 20, color: '#f093fb' },
    { name: 'Salsa', value: 12, color: '#4facfe' },
    { name: 'Bollywood', value: 8, color: '#43e97b' },
  ];

  const retentionData = [
    { month: 'Jan', retention: 88, target: 90 },
    { month: 'Feb', retention: 90, target: 90 },
    { month: 'Mar', retention: 92, target: 90 },
    { month: 'Apr', retention: 89, target: 90 },
    { month: 'May', retention: 93, target: 90 },
    { month: 'Jun', retention: 95, target: 90 },
  ];

  const peakHours = [
    { hour: '6AM', students: 12 },
    { hour: '9AM', students: 45 },
    { hour: '12PM', students: 28 },
    { hour: '3PM', students: 35 },
    { hour: '6PM', students: 78 },
    { hour: '9PM', students: 42 },
  ];

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: '$21,000',
      change: '+18.5%',
      trend: 'up',
      icon: FaDollarSign,
      color: '#10b981',
      prediction: '$23,500 next month'
    },
    {
      title: 'Active Students',
      value: '120',
      change: '+12.3%',
      trend: 'up',
      icon: FaUsers,
      color: '#667eea',
      prediction: '135 by next month'
    },
    {
      title: 'Retention Rate',
      value: '95%',
      change: '+3.2%',
      trend: 'up',
      icon: FaTrophy,
      color: '#f59e0b',
      prediction: 'Industry leading!'
    },
    {
      title: 'Attendance Rate',
      value: '89%',
      change: '-2.1%',
      trend: 'down',
      icon: FaCalendarCheck,
      color: '#ef4444',
      prediction: 'Improve with reminders'
    },
  ];

  const aiInsights = [
    {
      type: 'opportunity',
      icon: FaBolt,
      title: 'Revenue Opportunity',
      message: 'Add evening Hip-Hop class to capture 15+ waitlisted students. Estimated +$1,800/month',
      confidence: 92
    },
    {
      type: 'warning',
      icon: FaUsers,
      title: 'Retention Alert',
      message: '5 students at risk of churning. Recommend personalized outreach within 48 hours',
      confidence: 87
    },
    {
      type: 'success',
      icon: FaTrophy,
      title: 'Performance Highlight',
      message: 'Contemporary class attendance up 45%. Consider adding advanced level',
      confidence: 95
    },
    {
      type: 'insight',
      icon: FaBrain,
      title: 'Pricing Optimization',
      message: 'Annual plan conversion rate is 34%. A/B test $50 discount vs 1 free month',
      confidence: 89
    },
  ];

  useEffect(() => {
    // Simulate AI prediction loading
    setTimeout(() => {
      setPredictions({
        nextMonthRevenue: 23500,
        growthRate: 18.5,
        recommendedActions: [
          'Launch referral program',
          'Expand evening classes',
          'Introduce family packages'
        ]
      });
    }, 1500);
  }, []);

  return (
    <section className="analytics-dashboard-section">
      <Container fluid>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
        >
          <div className="header-content">
            <h2>
              <FaChartLine /> Analytics & Insights
            </h2>
            <p>AI-powered business intelligence for your dance studio</p>
          </div>
          <div className="header-controls">
            <Form.Select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </Form.Select>
            <Button className="export-btn">
              <FaChartPie /> Export Report
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <Row className="kpi-row">
          {kpiCards.map((kpi, index) => (
            <Col key={index} lg={3} md={6} className="mb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="kpi-card">
                  <Card.Body>
                    <div className="kpi-header">
                      <div className="kpi-icon" style={{ background: kpi.color }}>
                        <kpi.icon />
                      </div>
                      <div className={`kpi-change ${kpi.trend}`}>
                        {kpi.trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                        {kpi.change}
                      </div>
                    </div>
                    <h3 className="kpi-value">{kpi.value}</h3>
                    <p className="kpi-title">{kpi.title}</p>
                    <div className="kpi-prediction">
                      <FaRobot /> {kpi.prediction}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* AI Insights */}
        <Row className="mb-4">
          <Col lg={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="insights-card">
                <Card.Body>
                  <div className="insights-header">
                    <h4><FaBrain /> AI-Powered Insights</h4>
                    <span className="live-badge">
                      <span className="pulse-dot"></span> Live Analysis
                    </span>
                  </div>
                  <div className="insights-grid">
                    {aiInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        className={`insight-card ${insight.type}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <div className="insight-icon">
                          <insight.icon />
                        </div>
                        <div className="insight-content">
                          <h5>{insight.title}</h5>
                          <p>{insight.message}</p>
                          <div className="confidence-bar">
                            <div 
                              className="confidence-fill" 
                              style={{ width: `${insight.confidence}%` }}
                            ></div>
                            <span>{insight.confidence}% confidence</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Charts Row 1 */}
        <Row className="charts-row">
          <Col lg={8} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="chart-card">
                <Card.Body>
                  <h4>Revenue Trends & Predictions</h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#667eea" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        strokeWidth={3}
                        name="Actual Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorPredicted)" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="AI Prediction"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          <Col lg={4} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="chart-card">
                <Card.Body>
                  <h4>Class Popularity</h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={classPopularity}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {classPopularity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row className="charts-row">
          <Col lg={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="chart-card">
                <Card.Body>
                  <h4>Student Retention Rate</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={retentionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" domain={[80, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="retention" 
                        stroke="#667eea" 
                        strokeWidth={3}
                        dot={{ fill: '#667eea', r: 6 }}
                        name="Actual"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          <Col lg={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="chart-card">
                <Card.Body>
                  <h4>Peak Hours Analysis</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="students" fill="#764ba2" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default AnalyticsDashboard;
