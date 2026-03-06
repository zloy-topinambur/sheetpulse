# SheetPulse - Shopify Survey App

Professional survey builder for Shopify stores with Google Sheets integration.

## 🚀 Features

- **Embedded Shopify App** - Seamlessly integrated into Shopify Admin
- **Google Sheets Integration** - Automatic data export to Google Sheets
- **Custom Surveys** - Create unlimited survey questions and responses
- **Real-time Analytics** - Live survey results and insights
- **Flexible Triggers** - Timer, exit intent, cart-based, and post-purchase surveys
- **Multi-language Support** - English, Spanish, German, French, Portuguese
- **Subscription Billing** - 7-day free trial, then $4.99/month

## 🛠️ Tech Stack

- **Frontend**: Remix.js + React + Shopify Polaris
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: Shopify App Bridge
- **Deployment**: Render

## 📦 Installation

### Prerequisites

- Node.js >= 20.19
- PostgreSQL database
- Shopify Partner account

### Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd sheetpulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Fill in your credentials in .env
   ```

4. **Setup database**
   ```bash
   npm run setup
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Required variables in `.env`:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app.com
DATABASE_URL=postgresql://user:pass@host:port/db
SCOPES=read_customers,write_customers,read_orders,read_products,write_products,write_script_tags
```

### Shopify App Setup

1. Create app in [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Configure app settings:
   - App URL: `https://your-app.com`
   - Redirect URLs:
     - `https://your-app.com/auth/callback`
     - `https://your-app.com/auth/shopify/callback`
     - `https://your-app.com/app/billing`
3. Set API credentials in `.env`

## 🚀 Deployment

### Render

1. Connect GitHub repository to Render
2. Create Web Service with:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Output Directory**: `build`
3. Add environment variables
4. Setup PostgreSQL database

### Local Development

For local development with ngrok:

```bash
npm run dev
# In another terminal:
ngrok http 3000
```

Update `.env` with ngrok URL.

## 📋 Usage

### Creating Surveys

1. Install app from Shopify Admin → Apps
2. Start 7-day free trial
3. Configure Google Sheets integration
4. Create survey questions
5. Set triggers and display options
6. Launch survey on your store

### Google Sheets Setup

1. Create new Google Sheet
2. Go to Extensions → Apps Script
3. Paste bridge code from app settings
4. Deploy as Web App
5. Copy Web App URL to app settings

## 🧪 Testing

Check configuration:
```bash
npm run check-auth
```

Check deployment readiness:
```bash
npm run deploy-check
```

## 📚 Documentation

- [Setup Guide](SETUP.md)
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Remix Framework](https://remix.run/)
- [Prisma ORM](https://www.prisma.io/)

## 🐛 Troubleshooting

### Common Issues

1. **"Please open the app from Shopify Admin"**
   - This is expected for embedded apps
   - Open from Shopify Admin → Apps

2. **Authentication errors**
   - Check API credentials
   - Verify redirect URLs
   - Ensure HTTPS for production

3. **Database connection errors**
   - Check DATABASE_URL format
   - Verify PostgreSQL connection
   - Run `npm run setup`

## 🤝 Support

For issues and questions:
1. Check [Setup Guide](SETUP.md)
2. Review Shopify documentation
3. Check code comments for implementation details

## 📄 License

This project is licensed under the MIT License.