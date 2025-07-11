# SheetBill - Google Sheets Integration Setup

## 🔧 Google API Configuration

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
   - Google OAuth2 API

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Configure the OAuth consent screen:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173/auth/google/callback`

### 3. Get API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Restrict the API key to Google Sheets API and Google Drive API

### 4. Environment Variables Setup

Create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# App Configuration
VITE_APP_NAME=SheetBill
VITE_APP_URL=http://localhost:5173
```

## 🚀 Features

### Google Sheets Integration
- **Automatic Spreadsheet Creation**: Creates organized spreadsheets with proper headers
- **Real-time Data Sync**: All data syncs with Google Sheets in real-time
- **Batch Operations**: Efficient batch updates for better performance
- **Advanced Formatting**: Headers with styling and proper data validation

### Google Drive Integration
- **File Organization**: Automatically creates folders for better organization
- **File Sharing**: Share spreadsheets with team members
- **Access Control**: Manage permissions and access levels
- **File Management**: Copy, move, and delete files programmatically

### Data Management
- **Multi-sheet Support**: Separate sheets for different data types
- **Search Functionality**: Search across all sheets simultaneously
- **Export Capabilities**: Export data as CSV for external use
- **Statistics**: Get real-time statistics about your data

## 📊 Sheet Structure

The system creates the following sheets automatically:

1. **Dashboard** - Key metrics and KPIs
2. **Invoices** - Sales invoices and billing
3. **Products** - Product catalog and inventory
4. **Customers** - Customer database
5. **Vendors** - Supplier information
6. **Payments** - Payment tracking
7. **Expenses** - Expense management
8. **Quotations** - Quotes and estimates
9. **Credit_Notes** - Credit note management
10. **Settings** - Application settings

## 🔐 Security & Permissions

### Required OAuth Scopes
- `https://www.googleapis.com/auth/spreadsheets` - Full access to Google Sheets
- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app
- `https://www.googleapis.com/auth/userinfo.email` - Access to user email
- `https://www.googleapis.com/auth/userinfo.profile` - Access to user profile

### Best Practices
- Store refresh tokens securely in Supabase
- Implement token refresh logic for long-term access
- Use service accounts for server-side operations
- Implement proper error handling for API rate limits

## 🛠️ Usage Examples

### Connect Google Account
```typescript
import { googleAuthService } from './lib/google-auth'

// Initiate OAuth flow
const authUrl = googleAuthService.getAuthUrl()
window.open(authUrl, 'google-auth', 'width=500,height=600')
```

### Create Spreadsheet
```typescript
import { GoogleSheetsService } from './lib/google-sheets'

const sheetsService = new GoogleSheetsService(accessToken)
const spreadsheetId = await sheetsService.createUserSpreadsheet(userEmail)
```

### Add Data
```typescript
// Add invoice
await sheetsService.addInvoice(spreadsheetId, {
  id: 'INV-001',
  customer: 'Acme Corp',
  amount: 10000,
  tax: 1800,
  total: 11800,
  status: 'Paid'
})

// Add product
await sheetsService.addProduct(spreadsheetId, {
  id: 'PRD-001',
  name: 'Web Development',
  price: 50000,
  stock: '∞',
  category: 'Services'
})
```

### Search Data
```typescript
const results = await sheetsService.searchAllSheets(spreadsheetId, 'Acme')
console.log('Search results:', results)
```

### Export Data
```typescript
const csvData = await sheetsService.exportSheetAsCSV(spreadsheetId, 'Invoices')
// Download or process CSV data
```

## 🔄 Token Management

The system automatically handles:
- **Token Storage**: Securely stores tokens in Supabase
- **Token Refresh**: Automatically refreshes expired tokens
- **Error Handling**: Graceful handling of authentication errors
- **Fallback**: Falls back to mock data when offline

## 📱 Mobile Support

- Responsive design works on all devices
- Touch-friendly interface
- Offline capability with data sync when online
- Progressive Web App (PWA) features

## 🎨 UI Components

### Google Auth Button
```typescript
import GoogleAuthButton from './components/GoogleAuthButton'

<GoogleAuthButton
  onSuccess={(tokens) => console.log('Connected!', tokens)}
  onError={(error) => console.error('Auth failed:', error)}
/>
```

### Integration Status
The UI automatically shows:
- Connection status indicators
- Sync progress
- Error states with retry options
- Success confirmations

## 🚨 Troubleshooting

### Common Issues

1. **"Access blocked" error**
   - Ensure OAuth consent screen is configured
   - Add your domain to authorized origins

2. **"Invalid redirect URI"**
   - Check redirect URI matches exactly in Google Console
   - Ensure no trailing slashes

3. **"Insufficient permissions"**
   - Verify all required scopes are requested
   - Check API enablement in Google Console

4. **Rate limiting**
   - Implement exponential backoff
   - Use batch operations when possible

### Debug Mode
Set `VITE_DEBUG=true` in your `.env` file to enable detailed logging.

## 📈 Performance Optimization

- **Batch Updates**: Use batch operations for multiple changes
- **Caching**: Cache frequently accessed data
- **Lazy Loading**: Load data on demand
- **Compression**: Compress large datasets
- **Pagination**: Implement pagination for large datasets

## 🔮 Future Enhancements

- Real-time collaboration features
- Advanced data validation
- Custom formulas and calculations
- Integration with other Google Workspace apps
- Advanced reporting and analytics