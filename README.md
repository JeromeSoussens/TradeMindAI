<div align="center">
  <img src="logo.svg" alt="TradeMind AI Logo" width="120" />
  <h1>TradeMind AI</h1>
  <p>
    <strong>An intelligent trading dashboard that empowers retail investors to track their portfolio and receive real-time, AI-driven investment advice.</strong>
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
    <img src="https://img.shields.io/badge/React-19-blue" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript" />
    <img src="https://img.shields.io/badge/AI-Gemini%202.5-orange" alt="Gemini AI" />
  </p>
</div>

<br />

TradeMind AI combines real-time market data with advanced large language model analysis to suggest **Buy**, **Sell**, or **Hold** actions based on your specific entry points and market conditions.

## ✨ Key Features

- **🤖 AI Investment Advice**: Uses Google Gemini 2.5 Flash to analyze your positions and provide actionable "Buy", "Sell", or "Hold" recommendations with confidence scores.
- **📊 Interactive Charts**: Visualize stock performance with historical price data, including **SMA50** and **SMA200** technical indicators.
- **💰 Portfolio Tracking**: Real-time calculation of daily P/L, total P/L, and portfolio allocation by sector.
- **📝 Transaction History**: Log Buy and Sell transactions to automatically adjust your average buy price and realized gains.
- **📡 Real-Time Market Data**: Integrated with **Finnhub API** for live quotes and company profiles (includes a robust fallback mode for demo purposes).
- **🔐 Secure Authentication**: Simulated Google Authentication with persistent user sessions.
- **🌗 Dark Mode UI**: A sleek, professional financial interface built with **Tailwind CSS**.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express (Supports In-Memory simulation or PostgreSQL)
- **AI**: Google GenAI SDK (@google/genai)
- **Market Data**: Finnhub API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trademind-ai.git
   cd trademind-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory (optional but recommended for real data):
   ```env
   # Google Gemini API Key (Required for AI features)
   API_KEY=your_gemini_api_key_here
   
   # Finnhub API Key (Required for real market data, optional for demo mode)
   FINNHUB_API_KEY=your_finnhub_api_key_here
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   # Runs the Express server on port 3001
   npx ts-node server/index.ts
   ```

2. **Start the Frontend** (in a separate terminal)
   ```bash
   # Runs React dev server
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📖 Usage Guide

1. **Sign In**: Click "Sign in with Google" (Simulated for demo).
2. **Add Stocks**: Click "Add Stock", enter a ticker (e.g., AAPL), and the app will auto-fetch the price and name.
3. **View Advice**: The AI will automatically analyze your position. Click the "Sparkles" icon to refresh the analysis.
4. **Record Transactions**: Click "Buy" or "Sell" in the detail view to add more shares or take profits.
5. **Analyze Charts**: View the "Price History" chart to see the trend against the 50-day and 200-day moving averages.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).