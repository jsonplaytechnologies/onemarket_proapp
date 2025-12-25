# Phase 2 Implementation Guide - Provider App

## Overview

Phase 2 introduces significant changes to how providers receive, accept, and manage bookings. This includes an assignment system with timeouts, mandatory scope confirmation before quoting, availability management, and job duration tracking.

---

## Table of Contents

1. [Key Changes Summary](#1-key-changes-summary)
2. [New API Endpoints](#2-new-api-endpoints)
3. [New Booking Statuses](#3-new-booking-statuses)
4. [Provider Flow Changes](#4-provider-flow-changes)
5. [UI/UX Implementation](#5-uiux-implementation)
6. [Socket Events](#6-socket-events)
7. [Component Changes](#7-component-changes)
8. [Screen-by-Screen Implementation](#8-screen-by-screen-implementation)
9. [Availability Management](#9-availability-management)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. Key Changes Summary

### What's New for Providers:

| Feature | Description |
|---------|-------------|
| **Assignment System** | Receive booking requests with countdown timer to respond |
| **Accept/Reject Flow** | 15 minutes to accept or reject new requests |
| **Scope Confirmation** | Must chat with customer before sending quote |
| **Quote with Duration** | Send price AND estimated job duration |
| **Availability Schedule** | Set weekly recurring availability hours |
| **Trust Score** | Performance score affects booking assignments |
| **Job Conflicts** | System warns about overlapping bookings |
| **Service Questions** | View customer's answers to service questions |

### Provider Ranking System:

```
best_provider_score = trust_score × job_confidence

trust_score: EMA of your ratings (0-5, starts at 4.0)
job_confidence: min(completed_jobs / 50, 1.0) (starts at 0.1)

Example:
- New provider: 4.0 × 0.1 = 0.40 score
- 25 jobs, 4.5 rating: 4.5 × 0.5 = 2.25 score
- 50+ jobs, 4.8 rating: 4.8 × 1.0 = 4.80 score

Higher score = More auto-assigned bookings
```

---

## 2. New API Endpoints

### Add to `/src/constants/api.js`:

```javascript
// Phase 2 Booking Endpoints
BOOKING_ACCEPT_ASSIGNMENT: (id) => `/api/bookings/${id}/accept-assignment`,
BOOKING_REJECT_ASSIGNMENT: (id) => `/api/bookings/${id}/reject-assignment`,
BOOKING_QUOTE: (id) => `/api/bookings/${id}/quote`,  // Replaces BOOKING_QUOTATION
BOOKING_ANSWERS: (id) => `/api/bookings/${id}/answers`,

// Availability Management
MY_AVAILABILITY: '/api/pros/me/availability',
AVAILABILITY_SLOT: (id) => `/api/pros/me/availability/${id}`,

// Provider Stats
MY_RANKING: '/api/pros/me/ranking',
```

### API Method Signatures:

```javascript
// Accept Assignment (replaces accept booking)
PATCH /api/bookings/:id/accept-assignment
Response: {
  booking: { ...bookingWithUpdatedStatus },
  message: "Assignment accepted. Please discuss scope with customer."
}

// Reject Assignment
PATCH /api/bookings/:id/reject-assignment
Body: { reason: "string" }
Response: {
  message: "Assignment rejected",
  bookingStatus: "reassigned" | "cancelled"  // What happened to the booking
}

// Send Quote with Duration (replaces old quotation endpoint)
PATCH /api/bookings/:id/quote
Body: {
  amount: number,          // Price in XAF
  durationMinutes: number  // Estimated job duration
}
Response: {
  booking: { ...bookingWithQuote },
  message: "Quote sent to customer"
}

// Get Service Question Answers
GET /api/bookings/:id/answers
Response: {
  answers: [
    {
      id: "uuid",
      question_id: "uuid",
      answer_text: "Deep cleaning",
      question_text: "What type of cleaning?",
      question_type: "multiple_choice",
      display_order: 1
    }
  ]
}

// Get My Availability
GET /api/pros/me/availability
Response: {
  availability: [
    {
      id: "uuid",
      day_of_week: 1,  // 0=Sunday, 6=Saturday
      start_time: "09:00:00",
      end_time: "17:00:00",
      is_active: true
    }
  ]
}

// Set Availability (bulk replace)
PUT /api/pros/me/availability
Body: {
  slots: [
    { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 2, start_time: "09:00", end_time: "17:00" },
    // ...
  ]
}

// Add Single Slot
POST /api/pros/me/availability
Body: { day_of_week: 3, start_time: "14:00", end_time: "20:00" }

// Delete Slot
DELETE /api/pros/me/availability/:id

// Get My Ranking Stats
GET /api/pros/me/ranking
Response: {
  trust_score: 4.5,
  job_confidence: 0.68,
  best_provider_score: 3.06,
  completed_bookings: 34,
  average_rating: 4.5,
  rank_percentile: 75  // Top 25%
}
```

---

## 3. New Booking Statuses

### Provider-Relevant Status Flow:

```javascript
const PHASE2_PROVIDER_STATUSES = {
  // Assignment received
  waiting_approval: {
    label: 'New Request',
    color: '#FEF3C7',  // Amber
    textColor: '#92400E',
    description: 'Accept or reject this request',
    providerAction: 'ACCEPT_OR_REJECT',
    timeLimit: '15 minutes'
  },

  // After accepting
  waiting_quote: {
    label: 'Send Quote',
    color: '#DBEAFE',  // Blue
    textColor: '#1E40AF',
    description: 'Discuss scope and send your quote',
    providerAction: 'SEND_QUOTE',
    timeLimit: '30 minutes'
  },

  // Quote sent, waiting for user
  waiting_acceptance: {
    label: 'Quote Sent',
    color: '#E0E7FF',  // Indigo
    textColor: '#3730A3',
    description: 'Waiting for customer to accept',
    providerAction: 'WAIT',
    timeLimit: '30 minutes'
  },

  // Existing statuses with updated labels
  paid: {
    label: 'Ready to Go',
    description: 'Customer has paid. Start when ready.',
    providerAction: 'MARK_ON_THE_WAY'
  },
  // ... rest remain similar
};
```

### Provider Action Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                   NEW BOOKING REQUEST                           │
│                  [waiting_approval]                             │
│                                                                 │
│  ⏱️ 15 minutes to respond                                       │
│                                                                 │
│  Customer: John Doe                                             │
│  Service: House Cleaning                                        │
│  Location: Downtown, Yaoundé                                    │
│  Scheduled: Jan 15, 2025 at 10:00 AM                            │
│                                                                 │
│  ┌────────────────┐      ┌────────────────┐                    │
│  │    ACCEPT      │      │    REJECT      │                    │
│  └────────────────┘      └────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
       ACCEPTED                           REJECTED
            │                           (booking goes
            ▼                            to next pro)
┌─────────────────────────────────────────────────────────────────┐
│                   DISCUSS SCOPE                                 │
│                  [waiting_quote]                                │
│                                                                 │
│  ⏱️ 30 minutes to send quote                                    │
│                                                                 │
│  💬 Chat with customer to understand requirements               │
│                                                                 │
│  Customer's Answers:                                            │
│  Q: What type of cleaning? A: Deep cleaning                     │
│  Q: How many rooms? A: 4 rooms                                  │
│                                                                 │
│  [Open Chat]                    [Send Quote]                    │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SEND QUOTE                                    │
│                                                                 │
│  Amount (XAF):  [_________]                                     │
│                                                                 │
│  Estimated Duration:                                            │
│  ○ 1 hour    ○ 2 hours    ○ 3 hours    ○ 4 hours               │
│                                                                 │
│  [Send Quote to Customer]                                       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WAITING FOR ACCEPTANCE                        │
│                  [waiting_acceptance]                           │
│                                                                 │
│  ⏱️ Customer has 30 minutes to respond                          │
│                                                                 │
│  Your Quote: 15,000 XAF                                         │
│  Duration: 3 hours                                              │
│                                                                 │
│  Status: Waiting for customer...                                │
└─────────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
     USER ACCEPTS                       USER DECLINES
     & PAYS                             (booking may go
            │                            to next pro)
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   READY TO START                                │
│                      [paid]                                     │
│                                                                 │
│  Customer has paid!                                             │
│                                                                 │
│  Address: 123 Main St, Downtown                                 │
│  Phone: +237 6XX XXX XXX                                        │
│  Scheduled: Today at 10:00 AM                                   │
│                                                                 │
│  [I'm On The Way]                                               │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    (Normal flow continues)
```

---

## 4. Provider Flow Changes

### 4.1 Booking Request Notification

When assigned a booking:

```javascript
// Push notification
{
  title: "New Booking Request",
  body: "House Cleaning in Downtown. Respond within 15 minutes.",
  data: {
    type: "booking_assignment",
    bookingId: "uuid",
    expiresAt: "ISO timestamp"
  }
}
```

### 4.2 Mandatory Scope Discussion

**Before Quote:**
- Provider MUST review customer's service question answers
- Provider SHOULD chat with customer to clarify requirements
- Quote button only enabled after viewing answers/chat

### 4.3 Quote with Duration

**Old:** Send price only
**New:** Send price + estimated duration

Duration affects:
- Customer's calendar blocking
- Conflict detection for your next jobs
- Buffer time calculation

### 4.4 Timeout Consequences

| Timeout | Consequence |
|---------|-------------|
| Don't respond to assignment in 15 min | Booking goes to next provider |
| Don't send quote in 30 min | Booking goes to next provider |
| Customer doesn't accept in 30 min | Quote expires |

**Impact on ranking:** Timeouts may affect your trust_score

---

## 5. UI/UX Implementation

### 5.1 New Components Needed

#### `AssignmentTimer.js`
```jsx
// Countdown timer for responding to assignments

Props:
- expiresAt: ISO timestamp
- limboState: 'waiting_approval' | 'waiting_quote' | 'waiting_acceptance'
- onExpired: callback

UI:
┌────────────────────────────────────┐
│  ⏱️ Respond within: 14:32          │
│  ████████████░░░░░░░░  (progress)  │
└────────────────────────────────────┘

// Changes color as time runs low:
// > 5 min: Green
// 2-5 min: Yellow
// < 2 min: Red (pulsing)
```

#### `CustomerAnswersCard.js`
```jsx
// Displays customer's service question answers

Props:
- answers: Answer[]

UI:
┌────────────────────────────────────┐
│  📋 Customer's Requirements        │
│                                    │
│  What type of cleaning?            │
│  → Deep cleaning                   │
│                                    │
│  How many rooms?                   │
│  → 4 rooms                         │
│                                    │
│  Any special requests?             │
│  → Please focus on kitchen         │
└────────────────────────────────────┘
```

#### `QuoteFormModal.js`
```jsx
// Modal for sending quote with duration

Props:
- visible: boolean
- onClose: () => void
- onSubmit: (amount, durationMinutes) => void
- maxPrice: number  // Based on service category
- durationOptions: number[]  // [60, 120, 180, 240, ...]

UI:
┌────────────────────────────────────────────┐
│              Send Quote                    │
│                                            │
│  Amount (XAF)                              │
│  ┌─────────────────────────────────┐      │
│  │ 15,000                          │      │
│  └─────────────────────────────────┘      │
│                                            │
│  Estimated Duration                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ 1 hour  │ │ 2 hours │ │ 3 hours │      │
│  └─────────┘ └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐                  │
│  │ 4 hours │ │ 5 hours │                  │
│  └─────────┘ └─────────┘                  │
│                                            │
│  ┌──────────────────────────────────┐     │
│  │        Send Quote                │     │
│  └──────────────────────────────────┘     │
└────────────────────────────────────────────┘
```

#### `AvailabilityScheduler.js`
```jsx
// Weekly availability management

Props:
- availability: Slot[]
- onChange: (slots) => void

UI:
┌────────────────────────────────────────────┐
│         My Availability                    │
│                                            │
│  Monday    [09:00] - [17:00]  ✓ Active    │
│  Tuesday   [09:00] - [17:00]  ✓ Active    │
│  Wednesday [09:00] - [17:00]  ✓ Active    │
│  Thursday  [09:00] - [17:00]  ✓ Active    │
│  Friday    [09:00] - [17:00]  ✓ Active    │
│  Saturday  [10:00] - [14:00]  ✓ Active    │
│  Sunday    Not available                   │
│                                            │
│  [+ Add Time Slot]                         │
│                                            │
│  ┌──────────────────────────────────┐     │
│  │        Save Changes              │     │
│  └──────────────────────────────────┘     │
└────────────────────────────────────────────┘
```

#### `RankingStatsCard.js`
```jsx
// Display provider's ranking stats

Props:
- stats: RankingStats

UI:
┌────────────────────────────────────────────┐
│         Your Performance                   │
│                                            │
│  Trust Score        ★★★★☆  4.5/5.0        │
│  Job Confidence     ████████░░  68%        │
│  Provider Rank      Top 25%                │
│                                            │
│  Complete more jobs to increase ranking!   │
└────────────────────────────────────────────┘
```

### 5.2 Updated BookingCard for Providers

```jsx
// Add Phase 2 indicators

// Show timer if in limbo state
{booking.limbo_timeout_at && (
  <AssignmentTimer
    expiresAt={booking.limbo_timeout_at}
    limboState={booking.current_limbo_state}
    compact={true}
  />
)}

// Show booking path
{booking.booking_path === 'auto' && (
  <View className="bg-blue-100 px-2 py-0.5 rounded">
    <Text className="text-xs text-blue-700">Auto-Assigned</Text>
  </View>
)}

// Show assignment number (for auto path)
{booking.booking_path === 'auto' && booking.assignment_count > 1 && (
  <Text className="text-xs text-gray-500">
    Assignment #{booking.assignment_count}
  </Text>
)}

// Show scheduled time
{booking.requested_datetime && !booking.is_book_now && (
  <View className="flex-row items-center mt-1">
    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
    <Text className="text-xs text-gray-600 ml-1">
      {formatDateTime(booking.requested_datetime)}
    </Text>
  </View>
)}
```

---

## 6. Socket Events

### New Socket Events to Handle:

```javascript
// In SocketContext.js or useSocket.js

// New assignment notification
socket.on('new-assignment', ({ bookingId, serviceId, serviceName, expiresAt, customerName }) => {
  // Show prominent notification
  // Navigate to booking details
  // Start timer
});

// Assignment timeout warning
socket.on('assignment-timeout-warning', ({ bookingId, secondsRemaining }) => {
  // Show urgent warning
  // < 2 minutes: red pulsing UI
});

// Quote timeout warning
socket.on('quote-timeout-warning', ({ bookingId, secondsRemaining }) => {
  // Remind to send quote
});

// User accepted quote
socket.on('quote-accepted', ({ bookingId, paidAmount }) => {
  // Show success notification
  // Update booking to 'paid' status
});

// User declined quote
socket.on('quote-declined', ({ bookingId, reason }) => {
  // Show notification
  // Booking removed from your list (reassigned or cancelled)
});

// Job conflict warning
socket.on('job-conflict-warning', ({ currentBookingId, nextBookingId, conflictMinutes }) => {
  // Warn: "Your next job starts in {conflictMinutes} minutes"
  // May need to speed up or reschedule
});

// Next job auto-cancelled
socket.on('next-job-cancelled', ({ cancelledBookingId, reason }) => {
  // Notify: "Your next booking was cancelled due to timing conflict"
});
```

---

## 7. Component Changes

### 7.1 StatusBadge.js Updates

```javascript
const PROVIDER_STATUS_CONFIG = {
  // Phase 2 statuses
  waiting_approval: {
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    label: 'New Request',
    icon: 'notifications',
  },
  waiting_quote: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    label: 'Send Quote',
    icon: 'create',
  },
  waiting_acceptance: {
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    label: 'Quote Sent',
    icon: 'time',
  },

  // Existing with updated labels
  paid: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    label: 'Ready to Go',
    icon: 'checkmark-circle',
  },
  // ... rest
};
```

### 7.2 BookingsScreen.js - Tab Updates

```jsx
// Update tab filters for Phase 2

const BOOKING_TABS = [
  {
    key: 'action_required',
    label: 'Action Required',
    statuses: ['waiting_approval', 'waiting_quote', 'paid'],
    badge: true,  // Show count badge
  },
  {
    key: 'pending',
    label: 'Pending',
    statuses: ['waiting_acceptance', 'on_the_way', 'job_start_requested', 'job_started', 'job_complete_requested'],
  },
  {
    key: 'completed',
    label: 'History',
    statuses: ['completed', 'cancelled', 'rejected'],
  },
];

// Action Required tab shows bookings needing provider action
```

---

## 8. Screen-by-Screen Implementation

### 8.1 BookingDetailsScreen.js - Major Updates

```jsx
// State additions
const [answers, setAnswers] = useState([]);
const [showQuoteModal, setShowQuoteModal] = useState(false);
const [durationOptions, setDurationOptions] = useState([60, 120, 180, 240, 300]);

// Fetch answers when booking loads
useEffect(() => {
  if (booking?.id) {
    fetchBookingAnswers();
  }
}, [booking?.id]);

const fetchBookingAnswers = async () => {
  try {
    const response = await api.get(API.BOOKING_ANSWERS(booking.id));
    setAnswers(response.answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
  }
};

// New action handlers
const handleAcceptAssignment = async () => {
  try {
    setLoading(true);
    await api.patch(API.BOOKING_ACCEPT_ASSIGNMENT(booking.id));
    showToast('success', 'Assignment accepted! Discuss scope with customer.');
    refreshBooking();
  } catch (error) {
    showToast('error', error.message);
  } finally {
    setLoading(false);
  }
};

const handleRejectAssignment = async (reason) => {
  try {
    setLoading(true);
    await api.patch(API.BOOKING_REJECT_ASSIGNMENT(booking.id), { reason });
    showToast('info', 'Assignment rejected');
    navigation.goBack();
  } catch (error) {
    showToast('error', error.message);
  } finally {
    setLoading(false);
  }
};

const handleSendQuote = async (amount, durationMinutes) => {
  try {
    setLoading(true);
    await api.patch(API.BOOKING_QUOTE(booking.id), {
      amount,
      durationMinutes
    });
    setShowQuoteModal(false);
    showToast('success', 'Quote sent to customer');
    refreshBooking();
  } catch (error) {
    showToast('error', error.message);
  } finally {
    setLoading(false);
  }
};

// Render based on status
const renderActionSection = () => {
  switch (booking.status) {
    case 'waiting_approval':
      return (
        <View className="p-4 bg-white rounded-lg shadow-sm">
          <AssignmentTimer
            expiresAt={booking.limbo_timeout_at}
            limboState="waiting_approval"
          />

          {answers.length > 0 && (
            <CustomerAnswersCard answers={answers} />
          )}

          <View className="flex-row space-x-3 mt-4">
            <TouchableOpacity
              className="flex-1 bg-green-500 py-3 rounded-lg"
              onPress={handleAcceptAssignment}
            >
              <Text className="text-white text-center font-semibold">Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-red-500 py-3 rounded-lg"
              onPress={() => setShowRejectModal(true)}
            >
              <Text className="text-white text-center font-semibold">Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case 'waiting_quote':
      return (
        <View className="p-4 bg-white rounded-lg shadow-sm">
          <AssignmentTimer
            expiresAt={booking.limbo_timeout_at}
            limboState="waiting_quote"
          />

          {answers.length > 0 && (
            <CustomerAnswersCard answers={answers} />
          )}

          <Text className="text-gray-600 text-sm my-3">
            Chat with customer to understand their requirements, then send your quote.
          </Text>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-lg"
              onPress={() => navigation.navigate('Chat', { bookingId: booking.id })}
            >
              <Text className="text-gray-700 text-center font-semibold">Open Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-primary py-3 rounded-lg"
              onPress={() => setShowQuoteModal(true)}
            >
              <Text className="text-white text-center font-semibold">Send Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case 'waiting_acceptance':
      return (
        <View className="p-4 bg-white rounded-lg shadow-sm">
          <AssignmentTimer
            expiresAt={booking.limbo_timeout_at}
            limboState="waiting_acceptance"
          />

          <View className="bg-indigo-50 p-4 rounded-lg">
            <Text className="text-indigo-800 font-semibold">Your Quote</Text>
            <Text className="text-2xl font-bold text-indigo-900 mt-1">
              {formatCurrency(booking.quotation_amount)} XAF
            </Text>
            <Text className="text-indigo-600 mt-1">
              Duration: {booking.quoted_duration_minutes / 60} hours
            </Text>
          </View>

          <Text className="text-gray-500 text-center mt-3">
            Waiting for customer to accept...
          </Text>
        </View>
      );

    case 'paid':
      // Existing paid state actions...

    // ... other cases
  }
};

// Quote Modal
<QuoteFormModal
  visible={showQuoteModal}
  onClose={() => setShowQuoteModal(false)}
  onSubmit={handleSendQuote}
  durationOptions={durationOptions}
  serviceName={booking.service_name}
/>
```

### 8.2 New Screen: AvailabilityScreen.js

```jsx
// New screen for managing availability

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { api } from '../services/api';
import { API } from '../constants/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityScreen() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await api.get(API.MY_AVAILABILITY);
      setAvailability(response.availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(API.MY_AVAILABILITY, {
        slots: availability.filter(s => s.is_active)
      });
      showToast('success', 'Availability updated');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex) => {
    const existing = availability.find(s => s.day_of_week === dayIndex);
    if (existing) {
      // Toggle active status
      setAvailability(prev =>
        prev.map(s =>
          s.day_of_week === dayIndex
            ? { ...s, is_active: !s.is_active }
            : s
        )
      );
    } else {
      // Add default slot
      setAvailability(prev => [
        ...prev,
        {
          day_of_week: dayIndex,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true
        }
      ]);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-xl font-bold mb-4">My Availability</Text>

      <Text className="text-gray-600 mb-4">
        Set the hours you're available to accept bookings.
        Customers will only be able to book you during these times.
      </Text>

      {DAYS.map((day, index) => {
        const slot = availability.find(s => s.day_of_week === index);
        const isActive = slot?.is_active ?? false;

        return (
          <View
            key={day}
            className={`bg-white p-4 rounded-lg mb-2 ${!isActive && 'opacity-50'}`}
          >
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold">{day}</Text>
              <Switch
                value={isActive}
                onValueChange={() => toggleDay(index)}
              />
            </View>

            {isActive && slot && (
              <View className="flex-row items-center mt-2">
                <TimeInput
                  value={slot.start_time}
                  onChange={(time) => updateSlotTime(index, 'start_time', time)}
                />
                <Text className="mx-2">to</Text>
                <TimeInput
                  value={slot.end_time}
                  onChange={(time) => updateSlotTime(index, 'end_time', time)}
                />
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        className="bg-primary py-4 rounded-lg mt-4"
        onPress={handleSave}
        disabled={saving}
      >
        <Text className="text-white text-center font-bold">
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

### 8.3 HomeScreen.js - Add Ranking Card

```jsx
// Add ranking stats to home screen

const [rankingStats, setRankingStats] = useState(null);

useEffect(() => {
  fetchRankingStats();
}, []);

const fetchRankingStats = async () => {
  try {
    const response = await api.get(API.MY_RANKING);
    setRankingStats(response);
  } catch (error) {
    console.error('Error fetching ranking:', error);
  }
};

// In render:
{rankingStats && (
  <RankingStatsCard stats={rankingStats} />
)}
```

---

## 9. Availability Management

### 9.1 Add to Navigation

```jsx
// In navigation/AppNavigator.js or similar

// Add to Profile stack or as tab
<Stack.Screen
  name="Availability"
  component={AvailabilityScreen}
  options={{ title: 'My Availability' }}
/>

// Add menu item in Profile screen
<MenuItem
  icon="calendar-outline"
  label="Availability Schedule"
  onPress={() => navigation.navigate('Availability')}
/>
```

### 9.2 Availability Rules

1. **Buffer Times**: System blocks 2 hours before and after each job
2. **Conflict Detection**: Can't accept overlapping bookings
3. **Timezone**: All times in local timezone (Cameroon - WAT)
4. **Minimum Slot**: 1 hour minimum availability window

---

## 10. Testing Checklist

### Functional Tests:

- [ ] **Assignment Flow**
  - [ ] Receive new assignment notification
  - [ ] Timer displays correctly
  - [ ] Accept assignment → moves to waiting_quote
  - [ ] Reject assignment → booking removed from list
  - [ ] Timeout → booking removed from list

- [ ] **Quote Flow**
  - [ ] View customer's answers
  - [ ] Open chat works
  - [ ] Send quote with amount + duration
  - [ ] Quote appears in waiting_acceptance state
  - [ ] User accepts → moves to paid
  - [ ] User declines → booking removed

- [ ] **Availability**
  - [ ] Load current availability
  - [ ] Toggle days on/off
  - [ ] Change time ranges
  - [ ] Save changes
  - [ ] Only receive bookings during available hours

- [ ] **Timers**
  - [ ] All limbo timers display correctly
  - [ ] Color changes as time runs low
  - [ ] Timeout triggers correctly

- [ ] **Ranking**
  - [ ] Stats display on home screen
  - [ ] Updates after job completion
  - [ ] Updates after receiving review

### Edge Cases:

- [ ] Multiple pending assignments
- [ ] Timeout while writing quote
- [ ] App backgrounded with active timer
- [ ] Network error during accept/reject
- [ ] Conflicting booking times

---

## Local Testing Setup

### Update `/src/constants/api.js`:

```javascript
// For local testing:
export const API_BASE_URL = 'http://localhost:5000';

// For physical device (use your computer's IP):
export const API_BASE_URL = 'http://192.168.1.XXX:5000';
```

### Or use environment variable:
```
# .env
API_BASE_URL=http://localhost:5000
```

### Testing on Physical Device:
1. Find your computer's local IP
2. Ensure phone and computer on same network
3. Backend server.js should listen on `0.0.0.0:5000`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/constants/api.js` | UPDATE | Add Phase 2 endpoints |
| `src/components/bookings/StatusBadge.js` | UPDATE | Add new statuses |
| `src/components/bookings/AssignmentTimer.js` | CREATE | Countdown timer |
| `src/components/bookings/CustomerAnswersCard.js` | CREATE | Show answers |
| `src/components/bookings/QuoteFormModal.js` | CREATE | Quote form |
| `src/components/bookings/RankingStatsCard.js` | CREATE | Ranking display |
| `src/screens/bookings/BookingDetailsScreen.js` | UPDATE | Phase 2 actions |
| `src/screens/bookings/BookingsScreen.js` | UPDATE | New tab filters |
| `src/screens/profile/AvailabilityScreen.js` | CREATE | Availability mgmt |
| `src/screens/home/HomeScreen.js` | UPDATE | Add ranking card |
| `src/hooks/useSocket.js` | UPDATE | New socket events |
| `src/navigation/AppNavigator.js` | UPDATE | Add Availability screen |

---

## Implementation Priority

1. **Critical** (Core Provider Actions)
   - Accept/Reject assignment endpoints
   - Quote with duration
   - Timer component
   - BookingDetailsScreen updates

2. **High** (User Experience)
   - CustomerAnswersCard
   - Socket event handlers
   - Status updates

3. **Medium** (Feature Complete)
   - AvailabilityScreen
   - RankingStatsCard
   - All timer states

4. **Lower** (Polish)
   - Animations
   - Push notification sounds
   - Haptic feedback

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Backend API Version: Phase 2*
