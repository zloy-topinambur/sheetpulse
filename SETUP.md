# SheetPulse - Shopify Survey App Setup Guide

## 🚀 Quick Start

### 1. Environment Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sheetpulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy the example .env file
   cp .env.example .env
   ```

4. **Fill in your credentials in .env**
   - `SHOPIFY_API_KEY` - Get from Shopify Partner Dashboard
   - `SHOPIFY_API_SECRET` - Get from Shopify Partner Dashboard  
   - `DATABASE_URL` - PostgreSQL URL from Neon
   - `SHOPIFY_APP_URL` - Your app URL (localhost:3000 for dev)

### 2. Database Setup

1. **Setup PostgreSQL**
   - Option A: Use Neon (recommended) - https://neon.tech
   - Option B: Local PostgreSQL

2. **Run database migrations**
   ```bash
   npm run setup
   ```

### 3. Development

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Check configuration**
   ```bash
   npm run check-auth
   ```

## 🔧 Configuration

### For Local Development

1. **Use ngrok for HTTPS tunneling**
   ```bash
   npm run dev
   # In another terminal:
   ngrok http 3000
   ```

2. **Update URLs in .env**
   ```env
   APP_URL=https://your-ngrok-url.ngrok.io
   SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io
   ```

3. **Update shopify.app.toml**
   ```toml
   application_url = "https://your-ngrok-url.ngrok.io"
   ```

### For Production (Render)

1. **Deploy to Render**
   - Connect your GitHub repository
   - Set environment variables in Render dashboard
   - Configure PostgreSQL database

2. **Environment variables for Render**
   ```env
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SHOPIFY_APP_URL=https://your-app.onrender.com
   DATABASE_URL=your_postgres_url
   ```

## 🛠️ Shopify App Configuration

### In Shopify Partner Dashboard

1. **Create new app**
   - Go to Partner Dashboard → Apps → Create app
   - Select "Public app"
   - Enter app name: "SheetPulse"

2. **Configure app settings**
   - App URL: `https://your-app.onrender.com`
   - Allowed redirection URL(s):
     - `https://your-app.onrender.com/auth/callback`
     - `https://your-app.onrender.com/auth/shopify/callback`
     - `https://your-app.onrender.com/app/billing`

3. **Set API credentials**
   - Copy API Key and API Secret
   - Update your .env file

4. **Configure scopes**
   - Add required scopes:
     - `read_customers`
     - `write_customers`
     - `read_orders`
     - `read_products`
     - `write_products`
     - `write_script_tags`

## 📋 Important Notes

### Embedded App Behavior

- **This is an embedded app** - it MUST be opened from Shopify Admin
- Direct URL access will show "Please open the app from Shopify Admin"
- Users access the app via: Shopify Admin → Apps → SheetPulse

### Billing Flow

1. **Free trial**: 7 days free
2. **Subscription**: $4.99/month
3. **Billing check**: Automatic redirect to billing page if no active subscription

### Database Schema

The app uses Prisma ORM with the following models:
- `Session` - Shopify session data
- Metafields are stored in Shopify (not in your database)

## 🐛 Troubleshooting

### Common Issues

1. **"Please open the app from Shopify Admin"**
   - ✅ This is expected behavior for embedded apps
   - Open the app from Shopify Admin → Apps

2. **Authentication errors**
   - Check API credentials in .env
   - Verify redirect URLs match Partner Dashboard
   - Ensure HTTPS for production

3. **Database connection errors**
   - Verify DATABASE_URL format
   - Check PostgreSQL connection
   - Run `npm run setup` to migrate

4. **Billing not working**
   - Ensure billing configuration in shopify.server.js
   - Check Shopify Partner Dashboard billing settings

### Debug Commands

```bash
# Check configuration
npm run check-auth

# Build for production
npm run build

# Start production server
npm start

# Setup database
npm run setup
```

## 📚 Documentation

- [Shopify App Bridge](https://shopify.dev/docs/apps/tools/app-bridge)
- [Shopify Polaris](https://polaris.shopify.com/)
- [Remix Framework](https://remix.run/)
- [Prisma ORM](https://www.prisma.io/)

## 🤝 Support

For issues and questions:
1. Check this setup guide
2. Review Shopify documentation
3. Check the code comments for implementation details