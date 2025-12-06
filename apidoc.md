# OneMarket API Documentation - Pro (Service Provider) Role

**Base URL:** `https://onemarketbackend-production.up.railway.app`
**Role:** `pro`
**Platform:** React Native Mobile App

---

## Table of Contents

1. [Authentication & Signup](#1-authentication--signup)
2. [Profile Management](#2-profile-management)
3. [ID Document Verification](#3-id-document-verification)
4. [Service Management](#4-service-management)
5. [Zone Coverage](#5-zone-coverage)
6. [Availability Status](#6-availability-status)
7. [Booking Management](#7-booking-management)
8. [Earnings & Wallet](#8-earnings--wallet)
9. [Withdrawals](#9-withdrawals)
10. [Reviews & Responses](#10-reviews--responses)
11. [Chat & Messages](#11-chat--messages)
12. [Notifications](#12-notifications)
13. [Socket.io Real-time Events](#13-socketio-real-time-events)
14. [Approval Workflow](#14-approval-workflow)

---

## Important Notes

### API Response Field Names

**All API responses use snake_case field names** (e.g., `first_name`, `approval_status`, `is_online`).

### Account Approval Process

**Pro accounts require admin approval before accessing most features.**

### Approval Status Values:

- `pending` - Newly registered, awaiting approval
- `approved` - Can access all features
- `rejected` - Account rejected (can reapply)

### What Requires Approval:

- Managing services and zones
- Accepting bookings
- Receiving payments
- Withdrawing earnings

### What Works Without Approval:

- Login/Authentication
- Viewing own profile
- Uploading ID documents
- Viewing notifications

---

## 1. Authentication & Signup

### 1.1 Send OTP

```
POST /api/auth/send-otp
```

**Request Body:**

```json
{
  "phone": "74000004",
  "countryCode": "+241"
}
```

**Important:**

- Pro accounts MUST use Gabon phone numbers (+241)
- Phone number should be 8-10 digits without leading zero

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 600
  }
}
```

---

### 1.2 Verify OTP

```
POST /api/auth/verify-otp
```

**Request Body:**

```json
{
  "phone": "74000004",
  "code": "123456",
  "countryCode": "+241"
}
```

**Response (New User):**

```json
{
  "success": true,
  "message": "OTP verified. Please complete signup.",
  "data": {
    "isNewUser": true,
    "phone": "+24174000004"
  }
}
```

**Response (Existing User):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "isNewUser": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "phone": "+24174000004",
      "role": "pro",
      "is_active": true,
      "approval_status": "approved"
    }
  }
}
```

---

### 1.3 Signup as Pro

```
POST /api/auth/signup
```

**Request Body:**

```json
{
  "phone": "+24174000004",
  "role": "pro",
  "profile": {
    "firstName": "Jean",
    "lastName": "Pierre",
    "bio": "Professional plumber with 10 years experience"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "phone": "+24174000004",
      "role": "pro",
      "is_active": true,
      "is_verified": true,
      "approval_status": "pending",
      "created_at": "2025-11-28T10:00:00.000Z",
      "profile": {
        "first_name": "Jean",
        "last_name": "Pierre",
        "bio": "Professional plumber with 10 years experience"
      }
    }
  }
}
```

**Note:** New pro accounts have `approval_status: "pending"`. They must:

1. Upload ID documents
2. Add services and zones
3. Wait for admin approval

---

### 1.4 Get Current User

```
GET /api/auth/me
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "user-uuid",
    "phone": "+24174000004",
    "role": "pro",
    "country_code": "+241",
    "is_active": true,
    "is_verified": true,
    "is_online": true,
    "approval_status": "approved",
    "approval_notes": null,
    "approved_at": null,
    "last_login": "2025-12-05T19:22:10.195Z",
    "created_at": "2025-11-27T12:10:13.359Z",
    "profile": {
      "id": "pro-profile-uuid",
      "first_name": "Sylvie",
      "last_name": "Moussavou",
      "avatar_url": "https://cloudinary.com/...",
      "bio": "Professional plumber",
      "experience_years": 12,
      "average_rating": "4.70",
      "total_reviews": 89,
      "completed_bookings": 102,
      "is_id_verified": true,
      "services": [...],
      "zones": [...]
    }
  }
}
```

---

## 2. Profile Management

### 2.1 Get Pro Profile

```
GET /api/pros/me/profile
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "pro-profile-uuid",
    "user_id": "user-uuid",
    "first_name": "Jean",
    "last_name": "Pierre",
    "avatar_url": "https://cloudinary.com/avatar.jpg",
    "bio": "Professional plumber with 10 years experience in Libreville",
    "experience_years": 10,
    "average_rating": "4.80",
    "total_reviews": 45,
    "completed_bookings": 120,
    "total_bookings": 125,
    "is_online": true,
    "is_id_verified": true,
    "id_number": "GA****5678",
    "id_document_front": "https://...",
    "id_document_back": "https://...",
    "bank_name": "BGFI Bank",
    "account_number": "****4321",
    "account_holder_name": "Jean Pierre",
    "mobile_money_number": "+24174000004",
    "pending_balance": "150000.00",
    "total_earnings": "500000.00",
    "latitude": "0.43120000",
    "longitude": "9.47890000",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2025-12-04T07:56:45.944Z",
    "services": [
      {
        "id": "ps-uuid",
        "service_id": "service-uuid",
        "service_name": "Plumbing",
        "category_id": "cat-uuid",
        "category_name": "Home Repair",
        "custom_price": 18000,
        "base_price": 15000,
        "is_available": true
      }
    ],
    "zones": [
      {
        "id": "pz-uuid",
        "zone_id": "zone-uuid",
        "zone_name": "Centre-ville",
        "sub_zone_id": "subzone-uuid",
        "sub_zone_name": "Quartier Louis"
      }
    ]
  }
}
```

---

### 2.2 Update Pro Profile

```
PATCH /api/pros/me/profile
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request (Form Data):**

```
firstName: "Jean"
lastName: "Pierre"
bio: "Professional plumber with 10+ years experience"
experienceYears: "10"
bankName: "BGFI Bank"
accountNumber: "123456789"
accountHolderName: "Jean Pierre"
mobileMoneyNumber: "+241074000000"
avatar: [File] (optional)
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": "pro-profile-uuid",
    "first_name": "Jean",
    "last_name": "Pierre",
    "bio": "Professional plumber with 10+ years experience",
    "experience_years": 10,
    "avatar_url": "https://cloudinary.com/new-avatar.jpg",
    "bank_name": "BGFI Bank",
    "account_number": "123456789"
  }
}
```

**React Native Implementation:**

```javascript
const updateProProfile = async (profileData) => {
  const formData = new FormData();

  formData.append('firstName', profileData.firstName);
  formData.append('lastName', profileData.lastName);
  formData.append('bio', profileData.bio);
  if (profileData.experienceYears)
    formData.append('experienceYears', profileData.experienceYears);
  if (profileData.bankName) formData.append('bankName', profileData.bankName);
  if (profileData.accountNumber)
    formData.append('accountNumber', profileData.accountNumber);
  if (profileData.mobileMoneyNumber)
    formData.append('mobileMoneyNumber', profileData.mobileMoneyNumber);

  if (profileData.avatarUri) {
    const filename = profileData.avatarUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: profileData.avatarUri,
      name: filename,
      type,
    });
  }

  const response = await fetch(`${BASE_URL}/api/pros/me/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};
```

---

## 3. ID Document Verification

### 3.1 Upload ID Documents

Upload front and back images of ID document for verification.

```
POST /api/pros/me/documents
```

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request (Form Data):**

```
id_front: [File] - Front of ID card
id_back: [File] - Back of ID card
idNumber: "GA123456789"
```

**Response:**

```json
{
  "success": true,
  "message": "Documents uploaded. Pending verification.",
  "data": {
    "id_document_front": "https://cloudinary.com/id-front.jpg",
    "id_document_back": "https://cloudinary.com/id-back.jpg",
    "id_number": "GA123456789",
    "is_id_verified": true
  }
}
```

---

### 3.2 Get Uploaded Documents

```
GET /api/pros/me/documents
```

**Response:**

```json
{
  "success": true,
  "message": "Documents retrieved",
  "data": {
    "idDocumentFront": "https://cloudinary.com/id-front.jpg",
    "idDocumentBack": "https://cloudinary.com/id-back.jpg",
    "idNumber": "GA****6789",
    "isVerified": true,
    "verifiedAt": null
  }
}
```

---

## 4. Service Management

### 4.1 Get Available Services (All Services)

Get list of all services to choose from.

```
GET /api/services
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "service-uuid-1",
      "name": "Plumbing",
      "description": "Fix leaks, pipes, etc.",
      "base_price": "15000.00",
      "category_id": "cat-uuid",
      "category_name": "Home Repair",
      "estimated_duration": 60,
      "is_active": true,
      "tags": ["water", "pipes"]
    }
  ]
}
```

---

### 4.2 Get My Services

Get services I offer.

```
GET /api/pros/me/services
```

**Response:**

```json
{
  "success": true,
  "message": "Services retrieved",
  "data": [
    {
      "id": "pro-service-uuid",
      "service_id": "service-uuid",
      "service_name": "Plumbing",
      "category_id": "cat-uuid",
      "category_name": "Home Repair",
      "base_price": 15000,
      "custom_price": 18000,
      "is_available": true
    }
  ]
}
```

---

### 4.3 Add Service

```
POST /api/pros/me/services
```

**Request Body:**

```json
{
  "serviceId": "service-uuid",
  "customPrice": 18000
}
```

**Response:**

```json
{
  "success": true,
  "message": "Service added",
  "data": {
    "id": "pro-service-uuid",
    "service_id": "service-uuid",
    "custom_price": 18000,
    "is_available": true
  }
}
```

---

### 4.4 Update Service

```
PATCH /api/pros/me/services/:id
```

**Request Body:**

```json
{
  "customPrice": 20000,
  "isAvailable": true
}
```

---

### 4.5 Remove Service

```
DELETE /api/pros/me/services/:id
```

---

## 5. Zone Coverage

### 5.1 Get All Zones

```
GET /api/zones/all
```

**Response:**

```json
{
  "success": true,
  "message": "Zones retrieved",
  "data": [
    {
      "id": "zone-uuid-1",
      "name": "Centre-ville",
      "description": "Downtown Libreville - Commercial and administrative center",
      "is_active": true,
      "sub_zones": [
        { "id": "sz-uuid-1", "name": "Quartier Louis", "is_active": true },
        { "id": "sz-uuid-2", "name": "Mont-Bouët", "is_active": true }
      ]
    }
  ]
}
```

---

### 5.2 Get My Zones

```
GET /api/pros/me/zones
```

**Response:**

```json
{
  "success": true,
  "message": "Zones retrieved",
  "data": [
    {
      "id": "pro-zone-uuid",
      "zone_id": "zone-uuid",
      "zone_name": "Centre-ville",
      "sub_zone_id": "subzone-uuid",
      "sub_zone_name": "Quartier Louis"
    }
  ]
}
```

---

### 5.3 Add Zone Coverage

```
POST /api/pros/me/zones
```

**Request Body:**

```json
{
  "zoneId": "zone-uuid",
  "subZoneId": "subzone-uuid"
}
```

**Note:** `subZoneId` is optional. If not provided, covers entire zone.

---

### 5.4 Remove Zone Coverage

```
DELETE /api/pros/me/zones/:id
```

---

## 6. Availability Status

### 6.1 Set Online/Offline Status

```
PATCH /api/pros/me/availability
```

**Request Body:**

```json
{
  "isOnline": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Availability updated",
  "data": {
    "isOnline": true
  }
}
```

---

## 7. Booking Management

### 7.1 Get My Bookings

```
GET /api/bookings
```

**Query Parameters:**

- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

---

### 7.2 Get Booking Details

```
GET /api/bookings/:id
```

---

### 7.3 Accept Booking

```
PATCH /api/bookings/:id/accept
```

---

### 7.4 Reject Booking

```
PATCH /api/bookings/:id/reject
```

**Request Body:**

```json
{
  "reason": "Not available at that time"
}
```

---

### 7.5 Send Quotation

```
PATCH /api/bookings/:id/quotation
```

**Request Body:**

```json
{
  "amount": 25000
}
```

---

### 7.6 Mark On The Way

```
PATCH /api/bookings/:id/on-the-way
```

---

### 7.7 Request Job Start

```
PATCH /api/bookings/:id/start
```

---

### 7.8 Request Job Completion

```
PATCH /api/bookings/:id/complete
```

---

### 7.9 Cancel Booking

```
POST /api/bookings/:id/cancel
```

---

## 8. Earnings & Wallet

### 8.1 Get Earnings Summary

```
GET /api/pros/me/earnings
```

**Query Parameters:**

- `period` (optional): `today`, `week`, `month`, `year`, `all`

---

### 8.2 Get Transaction History

```
GET /api/pros/me/transactions
```

**Query Parameters:**

- `type` (optional): `earning`, `withdrawal`, `commission`
- `page` (optional)
- `limit` (optional)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "txn-uuid-1",
      "type": "earning",
      "amount": "22500.00",
      "description": "Booking BK-20251128-ABC123 completed",
      "booking_id": "booking-uuid",
      "booking_number": "BK-20251128-ABC123",
      "balance_after": "522500.00",
      "created_at": "2025-11-28T16:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

---

### 8.3 Get Transaction Details

```
GET /api/pros/me/transactions/:id
```

---

## 9. Withdrawals

### 9.1 Request Withdrawal

```
POST /api/pros/me/withdrawals
```

**Request Body:**

```json
{
  "amount": 100000,
  "method": "mobile_money"
}
```

**Methods:** `bank_transfer`, `mobile_money`

---

### 9.2 Get Withdrawal History

```
GET /api/pros/me/withdrawals
```

---

### 9.3 Get Withdrawal Details

```
GET /api/pros/me/withdrawals/:id
```

---

## 10. Reviews & Responses

### 10.1 Get My Reviews (Recommended)

```
GET /api/pros/me/reviews
```

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `minRating` (optional): Minimum rating filter

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "review-uuid",
      "booking_id": "booking-uuid",
      "rating": 5,
      "comment": "Excellent work! Very professional.",
      "user_name": "John D.",
      "service_name": "Plumbing",
      "pro_response": null,
      "created_at": "2025-11-28T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "summary": {
      "averageRating": 4.8,
      "totalReviews": 45,
      "ratingDistribution": {
        "5": 35,
        "4": 8,
        "3": 2,
        "2": 0,
        "1": 0
      }
    }
  }
}
```

### 10.2 Get Pro Reviews (Public - by Pro ID)

```
GET /api/reviews/pro/:proId
```

Use `/api/pros/me/reviews` instead for authenticated access.

---

### 10.3 Respond to Review

```
POST /api/reviews/:id/response
```

**Request Body:**

```json
{
  "response": "Thank you for your kind words! It was a pleasure working with you."
}
```

---

## 11. Chat & Messages

### 11.1 Get Booking Messages

```
GET /api/bookings/:id/messages
```

---

### 11.2 Send Message

```
POST /api/bookings/:id/messages
```

**Request Body:**

```json
{
  "content": "I can come at 2 PM",
  "messageType": "text"
}
```

---

### 11.3 Mark Messages as Read

```
PATCH /api/bookings/:id/messages/read
```

---

## 12. Notifications

### 12.1 Get Notifications

```
GET /api/notifications
```

---

### 12.2 Get Unread Count

```
GET /api/notifications/unread-count
```

---

### 12.3 Mark as Read

```
PATCH /api/notifications/:id/read
```

---

### 12.4 Mark All as Read

```
PATCH /api/notifications/read-all
```

---

## 13. Socket.io Real-time Events

### Connection Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('https://onemarketbackend-production.up.railway.app', {
  auth: {
    token: 'your-jwt-token',
  },
  transports: ['websocket'],
});
```

### Events to Listen (Pro Client)

| Event                    | Description           | Payload                                |
| ------------------------ | --------------------- | -------------------------------------- |
| `notification`           | New notification      | `{ title, message, type, bookingId? }` |
| `booking-status-changed` | Booking status update | `{ bookingId, status }`                |
| `new-message`            | New chat message      | `{ id, senderId, content, createdAt }` |

---

## 14. Approval Workflow

### Checking Approval Status

```javascript
const checkApprovalStatus = async () => {
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();

  switch (data.data.approval_status) {
    case 'pending':
      navigation.navigate('PendingApproval');
      break;
    case 'approved':
      navigation.navigate('ProHome');
      break;
    case 'rejected':
      navigation.navigate('AccountRejected', {
        reason: data.data.approval_notes,
      });
      break;
  }
};
```

---

## Quick Reference - All Pro Endpoints

| Method | Endpoint                        | Description         |
| ------ | ------------------------------- | ------------------- |
| POST   | `/api/auth/send-otp`            | Send OTP            |
| POST   | `/api/auth/verify-otp`          | Verify OTP          |
| POST   | `/api/auth/signup`              | Create pro account  |
| GET    | `/api/auth/me`                  | Get current user    |
| GET    | `/api/pros/me/profile`          | Get pro profile     |
| PATCH  | `/api/pros/me/profile`          | Update profile      |
| POST   | `/api/pros/me/documents`        | Upload ID documents |
| GET    | `/api/pros/me/documents`        | Get documents       |
| PATCH  | `/api/pros/me/availability`     | Set online/offline  |
| GET    | `/api/pros/me/services`         | Get my services     |
| POST   | `/api/pros/me/services`         | Add service         |
| PATCH  | `/api/pros/me/services/:id`     | Update service      |
| DELETE | `/api/pros/me/services/:id`     | Remove service      |
| GET    | `/api/pros/me/zones`            | Get my zones        |
| POST   | `/api/pros/me/zones`            | Add zone            |
| DELETE | `/api/pros/me/zones/:id`        | Remove zone         |
| GET    | `/api/pros/me/reviews`          | Get my reviews      |
| GET    | `/api/bookings`                 | Get my bookings     |
| GET    | `/api/bookings/:id`             | Get booking details |
| PATCH  | `/api/bookings/:id/accept`      | Accept booking      |
| PATCH  | `/api/bookings/:id/reject`      | Reject booking      |
| PATCH  | `/api/bookings/:id/quotation`   | Send quotation      |
| PATCH  | `/api/bookings/:id/on-the-way`  | Mark on the way     |
| PATCH  | `/api/bookings/:id/start`       | Request job start   |
| PATCH  | `/api/bookings/:id/complete`    | Request completion  |
| POST   | `/api/bookings/:id/cancel`      | Cancel booking      |
| GET    | `/api/bookings/:id/messages`    | Get messages        |
| POST   | `/api/bookings/:id/messages`    | Send message        |
| GET    | `/api/pros/me/earnings`         | Get earnings        |
| GET    | `/api/pros/me/transactions`     | Get transactions    |
| GET    | `/api/pros/me/transactions/:id` | Get transaction     |
| POST   | `/api/pros/me/withdrawals`      | Request withdrawal  |
| GET    | `/api/pros/me/withdrawals`      | Get withdrawals     |
| GET    | `/api/pros/me/withdrawals/:id`  | Get withdrawal      |
| POST   | `/api/reviews/:id/response`     | Respond to review   |
| GET    | `/api/notifications`            | Get notifications   |
| GET    | `/api/services`                 | Get all services    |
| GET    | `/api/zones/all`                | Get all zones       |

---

## Booking Status Flow (Pro Perspective)

```
[User creates booking]
        ↓
    PENDING ←── You see new booking notification
        ↓
[You accept or reject]
        ↓
    ACCEPTED
        ↓
[You send quotation]
        ↓
  QUOTATION_SENT
        ↓
[User pays] ←── You get payment notification
        ↓
      PAID ←── Full address now visible
        ↓
[You mark on the way]
        ↓
   ON_THE_WAY
        ↓
[You request job start]
        ↓
JOB_START_REQUESTED ←── Waiting for user
        ↓
[User confirms]
        ↓
   JOB_STARTED
        ↓
[You complete job]
        ↓
JOB_COMPLETE_REQUESTED ←── Waiting for user
        ↓
[User confirms]
        ↓
    COMPLETED ←── Earnings credited to wallet
```

---

**Document Version:** 1.1
**Last Updated:** December 6, 2025
**API Version:** 2.1.0

### Changelog v1.1

- Updated Base URL to production Railway URL
- Added verify-otp response for both new and existing users
- Changed all response field names to snake_case (matching actual API)
- Removed `responseTime` field (not in database)
- Added `experienceYears` field
- Added `/api/pros/me/reviews` endpoint for authenticated reviews access
- Updated profile update to use correct field names (accountNumber, experienceYears)
- Fixed approval_status field name in auth context
