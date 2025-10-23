# Classpace Feature Tiers

## Free Tier
**Price:** $0/month

### Core Features (Fully Functional)
- ✅ **1 Pod Limit** - Create and manage 1 classroom pod
- ✅ **Basic Pod Management** - Create, view, and join pods with unique codes
- ✅ **Live Sessions** - Participate in real-time classroom sessions
- ✅ **Chat Interface** - Message during sessions with teachers and students
- ✅ **Materials Sharing** - View and access learning materials
- ✅ **Quizzes** - Take quizzes and view scores
- ✅ **Projects** - Submit projects and receive feedback
- ✅ **Profile Management** - Manage your account and preferences
- ✅ **Email Support** - Access to help center and email support

### Limitations
- ❌ Limited to 1 pod only
- ❌ No AI teaching assistant
- ❌ No advanced analytics
- ❌ Standard support (email only, 24-48 hr response)

---

## Premium Tier
**Price:** $7/month

### All Free Features Plus:
- ✅ **Unlimited Pods** - Create and manage as many classroom pods as you need
- ✅ **AI Teaching Assistant** - Get AI-powered insights and assistance (Coming Soon)
- ✅ **Advanced Analytics** - Track student progress and engagement metrics (Coming Soon)
- ✅ **Priority Support** - Faster response times and dedicated assistance
- ✅ **Custom Branding** - Personalize your pods with custom themes (Coming Soon)
- ✅ **Session Recording** - Record and playback teaching sessions (Coming Soon)
- ✅ **Automated Grading** - AI-assisted quiz and project grading (Coming Soon)
- ✅ **Bulk Operations** - Manage multiple students and pods efficiently
- ✅ **Export Data** - Download student progress reports and analytics

---

## Current Implementation Status

### ✅ Fully Implemented
1. **Authentication System** - Email/password authentication with role-based access
2. **Pod System** - Create, join, and manage classroom pods
3. **Session Management** - Live sessions with chat interface
4. **Materials Management** - Upload and share learning materials
5. **Quiz System** - Create quizzes with multiple-choice questions
6. **Project System** - Assign and submit projects
7. **Subscription System** - Stripe integration for free/premium tiers
8. **Database & RLS** - Secure data access with Row-Level Security

### 🚧 In Progress / Coming Soon
1. **AI Teaching Assistant** - Powered by Lovable AI models
2. **Advanced Analytics Dashboard** - Student progress tracking
3. **Session Recording** - Save and replay sessions
4. **Custom Branding** - Theme customization
5. **Automated Grading** - AI-powered grading assistance

---

## Technical Implementation

### Free Tier Enforcement
- Pod limit enforced at database level via RLS policies
- UI checks subscription tier before allowing pod creation
- Free users see upgrade prompts when hitting limits

### Premium Tier Benefits
- Database check for `subscription.tier = 'premium'`
- Unlocks unlimited pod creation
- Access to premium-only features
- Priority support queue

### Backend Architecture
- **Database:** Supabase with RLS policies
- **Payments:** Stripe with recurring subscriptions
- **Edge Functions:** Subscription verification and checkout
- **Authentication:** Supabase Auth with email/password

---

## Feature Roadmap

### Phase 1 (Current)
- ✅ Core pod and session functionality
- ✅ Basic subscription system
- ✅ Quiz and project management

### Phase 2 (Next 3 Months)
- 🚧 AI teaching assistant integration
- 🚧 Advanced analytics dashboard
- 🚧 Session recording and playback

### Phase 3 (Future)
- ⏳ Custom branding and themes
- ⏳ Automated AI grading
- ⏳ Mobile app support
- ⏳ Integration with LMS platforms
