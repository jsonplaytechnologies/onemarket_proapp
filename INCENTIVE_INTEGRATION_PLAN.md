# Provider App Incentive & Referral System Integration Plan

## Executive Summary

The backend already has a **complete incentive system** with:
- Referral program (providers earn money for referring other providers)
- Tier system (Starter → Qualified → Experienced → Expert with 0%→2%→5%→10% earnings bonuses)
- Signup incentives (500 points / ~5 XAF for completing onboarding requirements)

The provider app has **NO integration** with these systems. This plan covers full integration.

---

## Phase 1: API Integration Layer

### 1.1 Add API Endpoints

**File:** `/src/constants/api.js`

Add these endpoints to the existing constants:

```javascript
// Incentive & Referral endpoints
REFERRAL_MY_CODE: '/api/referrals/my-code',
REFERRAL_STATS: '/api/referrals/stats',
REFERRAL_LIST: '/api/referrals/list',
REFERRAL_VALIDATE: '/api/referrals/validate',

TIER_MY_TIER: '/api/tiers/my-tier',
TIER_BENEFITS: '/api/tiers/benefits',
TIER_HISTORY: '/api/tiers/history',

INCENTIVE_SIGNUP_STATUS: '/api/incentives/signup-status',
INCENTIVE_DASHBOARD: '/api/incentives/dashboard',
```

### 1.2 Create Incentive Service

**File:** `/src/services/incentiveService.js`

```javascript
// Functions to implement:
- getMyReferralCode()        // GET /api/referrals/my-code
- getReferralStats()         // GET /api/referrals/stats
- getMyReferrals(page)       // GET /api/referrals/list?page=N
- validateReferralCode(code) // POST /api/referrals/validate

- getMyTier()                // GET /api/tiers/my-tier
- getTierBenefits()          // GET /api/tiers/benefits
- getTierHistory(page)       // GET /api/tiers/history?page=N

- getSignupStatus()          // GET /api/incentives/signup-status
- getIncentiveDashboard()    // GET /api/incentives/dashboard
```

---

## Phase 2: State Management

### 2.1 Create IncentiveContext

**File:** `/src/context/IncentiveContext.js`

**State Structure:**
```javascript
{
  // Referral data
  referralCode: {
    code: 'ABC12345',
    isActive: true,
    totalUses: 5,
    shareUrl: 'https://onemarket.app/ref/ABC12345'
  },
  referralStats: {
    totalReferrals: 5,
    pendingReferrals: 2,
    qualifiedReferrals: 2,
    rewardedReferrals: 1,
    totalRewardsEarned: 1500 // XAF
  },
  referralList: [],

  // Tier data
  currentTier: {
    tier: 'qualified',
    tierDisplayName: 'Qualified',
    jobsCompleted: 15,
    averageRating: 4.3,
    acceptanceRate: 0.92,
    bonusRate: 0.02, // 2%
    nextTier: 'experienced',
    progressToNext: {
      jobs: { current: 15, required: 50 },
      rating: { current: 4.3, required: 4.5 }
    }
  },
  tierHistory: [],
  tierBenefits: {},

  // Signup bonus
  signupBonus: {
    status: 'pending', // pending | qualified | rewarded | expired
    progress: {
      phoneVerified: true,
      adminApproved: true,
      jobsCompleted: 3,
      jobsRequired: 5,
      averageRating: 4.2,
      ratingRequired: 4.0
    },
    rewardAmount: 500,
    deadline: '2025-02-01T00:00:00Z'
  },

  // Loading states
  loading: false,
  error: null
}
```

**Methods:**
```javascript
- fetchIncentiveDashboard()  // Combined fetch for dashboard
- fetchReferralCode()        // Get/generate referral code
- fetchReferralStats()       // Get referral statistics
- fetchReferralList(page)    // Paginated referrals
- fetchTierStatus()          // Get current tier
- fetchSignupStatus()        // Get signup bonus status
- shareReferralCode()        // Native share dialog
- invalidateCache()          // Force refresh
```

### 2.2 Update CacheManager TTLs

**File:** `/src/utils/cacheManager.js`

Add cache keys:
```javascript
INCENTIVE_DASHBOARD: 2 * 60 * 1000,  // 2 minutes
REFERRAL_STATS: 2 * 60 * 1000,       // 2 minutes
TIER_STATUS: 5 * 60 * 1000,          // 5 minutes
TIER_BENEFITS: 30 * 60 * 1000,       // 30 minutes (static)
SIGNUP_STATUS: 2 * 60 * 1000,        // 2 minutes
```

---

## Phase 3: UI Components

### 3.1 New Screens to Create

**Directory:** `/src/screens/incentives/`

| Screen | Purpose | Key Features |
|--------|---------|--------------|
| `IncentiveDashboardScreen.js` | Main hub | Referral code, tier status, signup bonus, quick stats |
| `ReferralsScreen.js` | Referral management | Referral code with share, stats summary, partner list |
| `ReferralDetailsScreen.js` | Single referral | Partner info, qualification progress, reward status |
| `TierScreen.js` | Tier details | Current tier, benefits, progress to next, history |
| `TierBenefitsScreen.js` | All tiers overview | Comparison table of all tiers |

### 3.2 New Components to Create

**Directory:** `/src/components/incentives/`

| Component | Purpose |
|-----------|---------|
| `ReferralCodeCard.js` | Displays referral code with copy/share buttons |
| `TierBadge.js` | Visual tier indicator (Starter/Qualified/Experienced/Expert) |
| `TierProgressCard.js` | Progress bars to next tier |
| `ReferralPartnerCard.js` | Single referral partner item |
| `SignupBonusCard.js` | Signup incentive progress tracker |
| `IncentiveStatsCard.js` | Quick stats widget for dashboard |
| `ShareReferralModal.js` | Native share sheet integration |

### 3.3 Screen Designs

**IncentiveDashboardScreen:**
```
┌─────────────────────────────────────┐
│ ← Incentives & Rewards              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Your Tier: Qualified           │ │
│ │ ★★★★☆  2% Bonus on Earnings   │ │
│ │ [View Tier Details]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Referral Code: ABC12345        │ │
│ │ [Copy] [Share]                 │ │
│ │                                │ │
│ │ 5 referrals · 1,500 XAF earned│ │
│ │ [View Referrals →]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Signup Bonus Progress          │ │
│ │ ███████░░░ 3/5 jobs completed │ │
│ │ Earn 500 XAF when qualified    │ │
│ │ Deadline: Feb 1, 2025          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**ReferralsScreen:**
```
┌─────────────────────────────────────┐
│ ← Referrals                         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │      Your Referral Code         │ │
│ │        ABC12345                 │ │
│ │   [📋 Copy]  [📤 Share]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Total   Pending   Rewarded     │ │
│ │   5       2          1         │ │
│ │                                │ │
│ │ Total Earned: 1,500 XAF        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Your Referrals                      │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Jean Dupont                  │ │
│ │ Status: Qualified              │ │
│ │ Reward: 300 XAF (Pending)      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Marie Claire                 │ │
│ │ Status: Rewarded ✓             │ │
│ │ Reward: 300 XAF (Paid)         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Phase 4: Existing Screen Integration

### 4.1 HomeScreen Integration

**File:** `/src/screens/home/HomeScreen.js`

Add:
- Tier badge next to provider name
- Incentive summary card (if has pending bonuses or active referrals)
- Quick access to referral sharing

### 4.2 ProfileScreen Integration

**File:** `/src/screens/profile/ProfileScreen.js`

Add menu items:
```javascript
{ icon: 'gift', label: 'Incentives & Rewards', screen: 'IncentiveDashboard' }
{ icon: 'share-2', label: 'Refer a Provider', screen: 'Referrals' }
```

### 4.3 EarningsScreen Integration

**File:** `/src/screens/earnings/EarningsScreen.js`

Add:
- Tier bonus earnings breakdown
- Referral rewards in earnings summary
- Tier badge with current bonus rate

### 4.4 Navigation Updates

**File:** `/src/navigation/AppNavigator.js`

Add screens to ProfileStack:
```javascript
<Stack.Screen name="IncentiveDashboard" component={IncentiveDashboardScreen} />
<Stack.Screen name="Referrals" component={ReferralsScreen} />
<Stack.Screen name="ReferralDetails" component={ReferralDetailsScreen} />
<Stack.Screen name="Tier" component={TierScreen} />
<Stack.Screen name="TierBenefits" component={TierBenefitsScreen} />
```

---

## Phase 5: Signup Flow Integration

### 5.1 Accept Referral Code During Signup

**File:** `/src/screens/auth/SignupScreen.js`

Add:
- Optional referral code input field
- Real-time validation using `validateReferralCode()`
- Pass referral_code in signup payload

```javascript
// In signup form
<Input
  label="Referral Code (Optional)"
  value={referralCode}
  onChangeText={handleReferralCodeChange}
  placeholder="Enter code if referred by another provider"
/>
{referralCodeValid && (
  <Text className="text-green-600">
    ✓ Valid code! You'll receive a bonus when qualified.
  </Text>
)}
```

### 5.2 Update Auth Context

**File:** `/src/context/AuthContext.js`

Modify `signup()` to accept optional `referralCode` parameter.

---

## Phase 6: Real-time Updates

### 6.1 Socket Event Listeners

**File:** `/src/context/IncentiveContext.js` or `/src/context/NotificationContext.js`

Listen for incentive events:
```javascript
socket.on('referral:qualified', handleReferralQualified);
socket.on('referral:rewarded', handleReferralRewarded);
socket.on('tier:upgraded', handleTierUpgrade);
socket.on('tier:downgraded', handleTierDowngrade);
socket.on('signup_bonus:rewarded', handleSignupBonusRewarded);
```

### 6.2 Notification Integration

Update `NotificationContext` to handle incentive-related notifications with appropriate icons and navigation.

---

## Phase 7: Sharing Integration

### 7.1 Native Share

**File:** `/src/services/shareService.js`

```javascript
import { Share } from 'react-native';

export const shareReferralCode = async (code, shareUrl) => {
  const message = `Join OneMarket as a service provider! Use my referral code ${code} during signup and we'll both earn rewards. ${shareUrl}`;

  await Share.share({
    message,
    title: 'Join OneMarket'
  });
};
```

### 7.2 Deep Link Handling (Optional)

Handle `onemarket://ref/{code}` deep links to pre-fill referral code during signup.

---

## Implementation Order

| Step | Task | Priority | Effort |
|------|------|----------|--------|
| 1 | Add API endpoints to constants | High | Low |
| 2 | Create incentiveService.js | High | Medium |
| 3 | Create IncentiveContext.js | High | Medium |
| 4 | Update CacheManager TTLs | Medium | Low |
| 5 | Create TierBadge component | High | Low |
| 6 | Create ReferralCodeCard component | High | Low |
| 7 | Create IncentiveDashboardScreen | High | Medium |
| 8 | Create ReferralsScreen | High | Medium |
| 9 | Create TierScreen | Medium | Medium |
| 10 | Integrate with ProfileScreen menu | High | Low |
| 11 | Integrate with HomeScreen | Medium | Low |
| 12 | Integrate with EarningsScreen | Medium | Medium |
| 13 | Add referral code to SignupScreen | High | Medium |
| 14 | Add socket event listeners | Medium | Low |
| 15 | Create share functionality | Medium | Low |
| 16 | Create remaining detail screens | Low | Medium |
| 17 | Add deep link handling | Low | Medium |

---

## Backend API Reference

### Endpoints Available (Already Implemented)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/referrals/my-code` | GET | Get provider's referral code |
| `/api/referrals/stats` | GET | Get referral statistics |
| `/api/referrals/list` | GET | Paginated referral list |
| `/api/referrals/validate` | POST | Validate referral code |
| `/api/tiers/my-tier` | GET | Get current tier & progress |
| `/api/tiers/benefits` | GET | Get all tier benefits |
| `/api/tiers/history` | GET | Tier change history |
| `/api/incentives/signup-status` | GET | Signup bonus progress |
| `/api/incentives/dashboard` | GET | Combined incentive data |

### Provider Tier System

| Tier | Min Jobs | Min Rating | Bonus Rate |
|------|----------|------------|------------|
| Starter | 0 | 0 | 0% |
| Qualified | 10 | 4.0 | 2% |
| Experienced | 50 | 4.5 | 5% |
| Expert | 200 | 4.8 | 10% |

### Provider Referral Rewards

- Referrer earns: **300 XAF** per qualified referral (configurable)
- Qualification criteria: 5 jobs completed + 4.0 rating within 60 days
- Rewards added to `pro_profiles.pending_balance`

---

## Files to Create

```
src/
├── services/
│   ├── incentiveService.js      (NEW)
│   └── shareService.js          (NEW)
├── context/
│   └── IncentiveContext.js      (NEW)
├── screens/
│   └── incentives/              (NEW DIRECTORY)
│       ├── IncentiveDashboardScreen.js
│       ├── ReferralsScreen.js
│       ├── ReferralDetailsScreen.js
│       ├── TierScreen.js
│       └── TierBenefitsScreen.js
└── components/
    └── incentives/              (NEW DIRECTORY)
        ├── ReferralCodeCard.js
        ├── TierBadge.js
        ├── TierProgressCard.js
        ├── ReferralPartnerCard.js
        ├── SignupBonusCard.js
        └── IncentiveStatsCard.js
```

## Files to Modify

```
src/
├── constants/
│   └── api.js                   (add endpoints)
├── utils/
│   └── cacheManager.js          (add cache keys)
├── context/
│   ├── AuthContext.js           (referral code in signup)
│   └── NotificationContext.js   (incentive events)
├── navigation/
│   └── AppNavigator.js          (add screens)
└── screens/
    ├── auth/
    │   └── SignupScreen.js      (add referral code field)
    ├── home/
    │   └── HomeScreen.js        (add tier badge, incentive card)
    ├── profile/
    │   └── ProfileScreen.js     (add menu items)
    └── earnings/
        └── EarningsScreen.js    (add tier bonus breakdown)
```

---

## Estimated Scope

- **New files:** 12-15 files
- **Modified files:** 8-10 files
- **New components:** 6-8 components
- **New screens:** 5 screens
- **API integrations:** 9 endpoints
