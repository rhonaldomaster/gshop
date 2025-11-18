# Live Streaming Module - AWS IVS Integration

## 🚀 Quick Start

The Live Streaming module supports **both Mock and Real AWS IVS** services through a Factory Pattern. Just change your `.env` configuration!

## 🔄 Switching from Mock to Real AWS

### Current Status: **MOCK MODE** (Development)
Currently using `AwsIvsMockService` which simulates AWS IVS without real credentials.

### How to Enable Real AWS IVS

#### Step 1: Install AWS SDK
```bash
npm install @aws-sdk/client-ivs
```

#### Step 2: Update `.env` File
Change these variables in `backend/.env`:

```bash
# Change from false to true
AWS_IVS_ENABLED=true

# Add your real AWS credentials
AWS_IVS_REGION=us-east-1
AWS_IVS_ACCESS_KEY_ID=your-real-access-key-here
AWS_IVS_SECRET_ACCESS_KEY=your-real-secret-key-here
```

#### Step 3: Restart the Server
```bash
npm run start:dev
```

That's it! ✨ The module will automatically use `AwsIvsService` instead of the mock.

## 📋 How It Works

### Factory Pattern
The `LiveModule` uses a factory to decide which service to inject:

```typescript
// backend/src/live/live.module.ts
{
  provide: IVS_SERVICE,
  useFactory: (configService: ConfigService) => {
    const isEnabled = configService.get('AWS_IVS_ENABLED') === 'true';

    if (isEnabled) {
      return new AwsIvsService(configService);  // Real AWS
    } else {
      return new AwsIvsMockService();           // Mock
    }
  },
}
```

### Common Interface
Both services implement the same interface (`IIvsService`):

```typescript
interface IIvsService {
  createChannel(name: string): Promise<IVSChannelWithKey>;
  getChannel(channelArn: string): Promise<IVSChannel | null>;
  deleteChannel(channelArn: string): Promise<void>;
  getStreamKey(channelArn: string): Promise<IVSStreamKey | null>;
  getThumbnailUrl(channelArn: string): string;
  getRecordingUrl(channelArn: string): string;
}
```

## 🧪 Mock Service Features

When `AWS_IVS_ENABLED=false` (default for development):

- ✅ Simulates channel creation with fake ARNs
- ✅ Generates mock RTMP ingest URLs
- ✅ Generates mock HLS playback URLs
- ✅ Generates mock stream keys (format: `sk_[40 random chars]`)
- ✅ Stores channels in memory (lost on restart)
- ✅ No external API calls
- ✅ No AWS costs

**Perfect for:**
- Local development
- Testing
- CI/CD pipelines
- When you don't have AWS credentials

## 🚀 Real AWS Service Features

When `AWS_IVS_ENABLED=true`:

- ✅ Connects to real AWS IVS API
- ✅ Creates actual IVS channels
- ✅ Real RTMP ingest endpoints
- ✅ Real HLS playback URLs
- ✅ Automatic channel management
- ✅ Production-ready streaming

**Required for:**
- Production deployment
- Staging environment
- Real live streaming

## 📝 Getting AWS Credentials

### Option 1: AWS Console
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new IAM user with programmatic access
3. Attach the policy: `AmazonIVSFullAccess`
4. Copy the Access Key ID and Secret Access Key

### Option 2: AWS CLI
```bash
aws iam create-user --user-name gshop-ivs-user
aws iam attach-user-policy --user-name gshop-ivs-user --policy-arn arn:aws:iam::aws:policy/AmazonIVSFullAccess
aws iam create-access-key --user-name gshop-ivs-user
```

## 🛠️ Files Structure

```
backend/src/live/
├── interfaces/
│   └── ivs-service.interface.ts    # Common interface
├── aws-ivs-mock.service.ts          # Mock implementation (dev)
├── aws-ivs.service.ts                # Real implementation (prod)
├── live.module.ts                    # Factory pattern setup
├── live.service.ts                   # Business logic (uses IVS_SERVICE)
├── live.controller.ts                # REST endpoints
├── live.gateway.ts                   # WebSocket gateway
├── live.entity.ts                    # Database entities
└── README.md                         # This file
```

## 🔍 Verification

Check which service is being used when you start the server:

### Mock Mode:
```
[Live Module] 🧪 Using MOCK AWS IVS Service (development mode)
[AWS IVS MOCK] Created channel: arn:aws:ivs:us-east-1:123456789012:channel/...
```

### Real AWS Mode:
```
[Live Module] 🚀 Using REAL AWS IVS Service
[AWS IVS] Client initialized for region: us-east-1
[AWS IVS] Created channel: arn:aws:ivs:us-east-1:YOUR_ACCOUNT:channel/...
```

## 💰 AWS Costs

AWS IVS Pricing (as of 2025):
- **Input**: ~$0.015 per hour of video streamed
- **Output**: ~$0.015 per viewer hour
- **Recording**: ~$0.015 per hour recorded
- **No minimum fees**

Example: 1 seller streaming to 100 viewers for 1 hour = ~$1.50

## ⚠️ Troubleshooting

### Error: `AWS IVS SDK not found`
```bash
npm install @aws-sdk/client-ivs
```

### Error: `AWS credentials not configured`
Check your `.env` file:
```bash
AWS_IVS_ACCESS_KEY_ID=your-key
AWS_IVS_SECRET_ACCESS_KEY=your-secret
```

### Mock service not switching to real
1. Verify `AWS_IVS_ENABLED=true` in `.env`
2. Restart the server completely
3. Check console logs for which service is loaded

## 📚 Related Documentation

- [AWS IVS Documentation](https://docs.aws.amazon.com/ivs/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ivs/)
- [PLAN_LIVE_STREAMING_ENHANCEMENT.md](../../../docs/PLAN_LIVE_STREAMING_ENHANCEMENT.md)

## 🎯 Next Steps

1. Get AWS credentials from your AWS account
2. Install AWS SDK: `npm install @aws-sdk/client-ivs`
3. Update `.env` with real credentials
4. Set `AWS_IVS_ENABLED=true`
5. Restart server and test!

---

**Questions?** Check the main plan document or AWS IVS documentation.
