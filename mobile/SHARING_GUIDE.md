# 📤 Dynamic Links & Social Sharing Guide

Complete guide for implementing social sharing with dynamic links in GSHOP.

## 📋 Overview

The sharing system allows users to share:
- Products
- Live streams
- Affiliate links
- Orders
- Profiles

Across multiple platforms:
- WhatsApp
- Facebook
- Twitter/X
- Instagram
- Telegram
- Email
- SMS
- Generic share sheet

## 🚀 Quick Start

### Basic Product Sharing

```typescript
import { useShare } from '@/hooks/useShare';

function ProductDetail({ product }) {
  const { shareProduct, isSharing } = useShare();

  const handleShare = async () => {
    const result = await shareProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: 'USD',
      imageUrl: product.imageUrl,
      description: product.description,
    });

    if (result.success) {
      Alert.alert('Success', 'Product shared!');
    }
  };

  return (
    <Button
      title="Share"
      onPress={handleShare}
      loading={isSharing}
    />
  );
}
```

## 🎯 Usage Examples

### 1. Share Product with Platform Selection

```typescript
import { useShare, SharePlatform } from '@/hooks/useShare';

function ShareButton({ product }) {
  const { shareProduct } = useShare();

  const showShareMenu = () => {
    Alert.alert('Share via', '', [
      {
        text: 'WhatsApp',
        onPress: () => shareProduct(product, SharePlatform.WHATSAPP),
      },
      {
        text: 'Facebook',
        onPress: () => shareProduct(product, SharePlatform.FACEBOOK),
      },
      {
        text: 'Twitter',
        onPress: () => shareProduct(product, SharePlatform.TWITTER),
      },
      {
        text: 'More...',
        onPress: () => shareProduct(product, SharePlatform.GENERIC),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return <Button title="Share" onPress={showShareMenu} />;
}
```

### 2. Quick Share Buttons

```typescript
import { useProductShare } from '@/hooks/useShare';
import { Ionicons } from '@expo/vector-icons';

function QuickShareButtons({ product }) {
  const {
    shareToWhatsApp,
    shareToFacebook,
    shareToTwitter,
    shareGeneric,
  } = useProductShare(product);

  return (
    <View style={styles.shareButtons}>
      <TouchableOpacity onPress={shareToWhatsApp}>
        <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
      </TouchableOpacity>

      <TouchableOpacity onPress={shareToFacebook}>
        <Ionicons name="logo-facebook" size={32} color="#1877F2" />
      </TouchableOpacity>

      <TouchableOpacity onPress={shareToTwitter}>
        <Ionicons name="logo-twitter" size={32} color="#1DA1F2" />
      </TouchableOpacity>

      <TouchableOpacity onPress={shareGeneric}>
        <Ionicons name="share-social" size={32} color="#666" />
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Share Live Stream

```typescript
import { useShare } from '@/hooks/useShare';

function LiveStreamScreen({ stream }) {
  const { shareLiveStream } = useShare();

  const handleInviteFriends = async () => {
    await shareLiveStream({
      id: stream.id,
      title: stream.title,
      hostName: stream.hostName,
      thumbnailUrl: stream.thumbnailUrl,
    });
  };

  return (
    <Button
      title="Invite Friends"
      onPress={handleInviteFriends}
    />
  );
}
```

### 4. Affiliate Link Sharing

```typescript
import { useAffiliateShare } from '@/hooks/useShare';

function AffiliateProductCard({ product, affiliateCode }) {
  const { shareProduct } = useAffiliateShare(affiliateCode);

  const handleShareAffiliate = async () => {
    const result = await shareProduct(
      product.id,
      product.name,
      SharePlatform.WHATSAPP
    );

    if (result.success) {
      // Track affiliate share for commission
      console.log('Affiliate link shared!');
    }
  };

  return (
    <Button title="Share & Earn" onPress={handleShareAffiliate} />
  );
}
```

### 5. Share Order Confirmation

```typescript
import { useShare } from '@/hooks/useShare';

function OrderConfirmationScreen({ order }) {
  const { shareOrderConfirmation } = useShare();

  const handleShareOrder = async () => {
    await shareOrderConfirmation(order.id, order.total);
  };

  return (
    <View>
      <Text>Order Confirmed!</Text>
      <Button title="Share on Social Media" onPress={handleShareOrder} />
    </View>
  );
}
```

### 6. Check Platform Availability

```typescript
import { useSharePlatform } from '@/hooks/useShare';

function ShareOptionsScreen() {
  const { availablePlatforms, isLoading, checkPlatforms } = useSharePlatform();

  useEffect(() => {
    checkPlatforms();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      {availablePlatforms.includes(SharePlatform.WHATSAPP) && (
        <Button title="Share on WhatsApp" />
      )}
      {availablePlatforms.includes(SharePlatform.FACEBOOK) && (
        <Button title="Share on Facebook" />
      )}
      {/* More platforms... */}
    </View>
  );
}
```

## 📱 Share Message Formats

### Product Share
```
🛍️ Check out [Product Name] on GSHOP!

💰 Only $99.99

https://gshop.com/product/123
```

### Live Stream Share
```
🎥 [Host Name] is LIVE on GSHOP!

[Stream Title]

Join now! https://gshop.com/live/456
```

### Affiliate Share (with product)
```
💎 Found this amazing product: [Product Name]

Shop on GSHOP with my link! https://gshop.com/aff/xyz789
```

### Affiliate Share (generic)
```
🛍️ Shop on GSHOP with my special link and get great deals!

https://gshop.com/aff/xyz789
```

## 🎨 Custom Share Messages

### Custom Product Message

```typescript
import shareService from '@/services/share.service';

const customShare = async () => {
  const options = {
    title: 'Amazing Deal!',
    message: `🔥 FLASH SALE: ${product.name} - ${discount}% OFF!\n\nOnly ${remainingStock} left!\n\n`,
    url: buildProductLink(product.id),
  };

  await Share.open(options);
};
```

### Custom Affiliate Message

```typescript
const { shareAffiliateLink } = useShare();

await shareAffiliateLink({
  code: affiliateCode,
  productName: product.name,
  customMessage: `💸 Earn cashback on this purchase!\n\n${product.name}\n\nUse my exclusive link:`,
});
```

## 🔗 Dynamic Link Generation

### Building Links Programmatically

```typescript
import {
  buildProductLink,
  buildLiveStreamLink,
  buildAffiliateLink,
} from '@/services/deeplink.service';

// Product link
const productUrl = buildProductLink('123');
// https://gshop.com/product/123

// Live stream link
const liveUrl = buildLiveStreamLink('456');
// https://gshop.com/live/456

// Affiliate link with tracking
const affiliateUrl = buildAffiliateLink('xyz789');
// https://gshop.com/aff/xyz789

// Add UTM parameters for campaign tracking
const campaignUrl = `${productUrl}?utm_source=whatsapp&utm_medium=share&utm_campaign=summer2025`;
```

## 📊 Analytics & Tracking

All shares are automatically tracked with:

```typescript
{
  eventName: 'share',
  platform: 'whatsapp',
  contentType: 'product',
  contentId: '123',
  success: true,
  timestamp: 1234567890
}
```

### Custom Share Tracking

```typescript
import analyticsService from '@/services/analytics.service';

// Track custom share event
const handleCustomShare = async () => {
  const result = await shareProduct(product);

  if (result.success) {
    // Additional tracking
    analyticsService.track('custom' as any, {
      eventName: 'viral_share',
      productId: product.id,
      expectedReach: calculateReach(user.followers),
      shareChain: user.shareHistory,
    });
  }
};
```

## 🎯 Use Cases

### Use Case 1: Viral Product Campaign

```typescript
function ViralCampaignCard({ product, campaign }) {
  const { shareProduct } = useShare();

  const shareForDiscount = async (platform) => {
    const result = await shareProduct(
      {
        ...product,
        customMessage: `Share & get ${campaign.discount}% off!`,
      },
      platform
    );

    if (result.success) {
      // Award discount code
      await claimDiscount(campaign.id, user.id);
      Alert.alert('Success!', `You got ${campaign.discount}% off!`);
    }
  };

  return (
    <View>
      <Text>Share to unlock {campaign.discount}% discount!</Text>
      <Button title="Share Now" onPress={() => shareForDiscount(SharePlatform.GENERIC)} />
    </View>
  );
}
```

### Use Case 2: Referral Program

```typescript
function ReferralScreen({ user }) {
  const { shareAffiliateLink } = useShare();
  const referralCode = user.referralCode;

  const shareReferral = async () => {
    await shareAffiliateLink({
      code: referralCode,
      customMessage: `Join GSHOP and get $10 off your first order!\n\nI'll get $10 too when you make a purchase 🎉\n\n`,
    });
  };

  return (
    <View>
      <Text>Your Referral Code: {referralCode}</Text>
      <Text>Earnings: ${user.referralEarnings}</Text>
      <Button title="Invite Friends" onPress={shareReferral} />
    </View>
  );
}
```

### Use Case 3: Social Proof

```typescript
function OrderSuccessScreen({ order }) {
  const { shareOrderConfirmation } = useShare();

  const shareMyPurchase = async () => {
    await shareOrderConfirmation(
      order.id,
      order.total,
      SharePlatform.INSTAGRAM
    );

    // Reward social shares
    await awardLoyaltyPoints(user.id, 50);
  };

  return (
    <View>
      <Text>✨ Order Confirmed!</Text>
      <Button
        title="Share & Earn 50 Points"
        onPress={shareMyPurchase}
      />
    </View>
  );
}
```

## 🔧 Advanced Features

### Share with Image

```typescript
import Share from 'react-native-share';

const shareWithImage = async () => {
  const options = {
    title: product.name,
    message: `Check out ${product.name}!`,
    url: buildProductLink(product.id),
    type: 'image/jpeg',
    // Base64 image data
    image: product.imageBase64,
  };

  await Share.open(options);
};
```

### Share to Instagram Story

```typescript
const shareToInstagramStory = async () => {
  const shareOptions = {
    social: Social.Instagram,
    backgroundImage: product.imageUrl,
    stickerImage: 'data:image/png;base64,...', // Your sticker
    backgroundBottomColor: '#ffffff',
    backgroundTopColor: '#6366f1',
  };

  await Share.shareSingle(shareOptions);
};
```

### Copy Link to Clipboard

```typescript
import * as Clipboard from 'expo-clipboard';

const copyLink = async () => {
  const url = buildProductLink(product.id);
  await Clipboard.setStringAsync(url);
  Alert.alert('Copied!', 'Link copied to clipboard');

  // Track copy event
  analyticsService.track('custom' as any, {
    eventName: 'link_copied',
    contentType: 'product',
    contentId: product.id,
  });
};
```

## 🎨 UI Components

### Share Bottom Sheet

```typescript
import { BottomSheet } from '@/components';

function ShareBottomSheet({ visible, onClose, product }) {
  const { shareProduct } = useShare();

  const platforms = [
    { name: 'WhatsApp', icon: 'logo-whatsapp', platform: SharePlatform.WHATSAPP },
    { name: 'Facebook', icon: 'logo-facebook', platform: SharePlatform.FACEBOOK },
    { name: 'Twitter', icon: 'logo-twitter', platform: SharePlatform.TWITTER },
    { name: 'Copy Link', icon: 'copy', platform: null },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Share Product</Text>
        <View style={styles.grid}>
          {platforms.map((p) => (
            <TouchableOpacity
              key={p.name}
              onPress={() => {
                if (p.platform) {
                  shareProduct(product, p.platform);
                } else {
                  copyLink();
                }
                onClose();
              }}
            >
              <View style={styles.platform}>
                <Ionicons name={p.icon} size={32} />
                <Text>{p.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}
```

## ✅ Best Practices

### DO:
✅ Provide multiple sharing options
✅ Track all share events
✅ Reward social shares (points, discounts)
✅ Customize messages for each platform
✅ Test shares on physical devices
✅ Handle share failures gracefully
✅ Include product images when possible

### DON'T:
❌ Force users to share
❌ Spam social platforms
❌ Include long URLs without shortening
❌ Forget to track share success/failure
❌ Use generic messages
❌ Make sharing mandatory for features

## 🆘 Troubleshooting

### Sharing Not Working

1. **Check package installation**:
   ```bash
   npm install react-native-share
   cd ios && pod install
   ```

2. **Verify platform availability**:
   ```typescript
   const available = await shareService.isPlatformAvailable(SharePlatform.WHATSAPP);
   console.log('WhatsApp available:', available);
   ```

3. **Check iOS/Android permissions** (usually not required for sharing)

### Instagram Not Sharing

- Instagram requires `stickerImage` for story sharing
- Regular post sharing opens Instagram app, doesn't auto-post

### Links Not Opening App

- Ensure deep linking is configured (see DEEP_LINKING_GUIDE.md)
- Test universal links separately

## 📚 Resources

- [React Native Share Documentation](https://react-native-share.github.io/react-native-share/)
- [Deep Linking Guide](./DEEP_LINKING_GUIDE.md)
- [Analytics Integration](./ANALYTICS_INTEGRATION.md)

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0