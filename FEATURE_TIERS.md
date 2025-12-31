# Classpace Feature Tiers (Audit: Dec 2025)

## 🎓 Student Tiers

### Student Free
**Price:** $0/month
- **Pod Access**: Join unlimited pods via code.
- **AI Assistant**: Limited to **3 Chats** total by default (unless upgraded).
- **Personal AI Resources**: Limited to **1 set** of Flashcards, Quizzes, or Notes each.
- **Phoenix AI**: Basic access.
- **Career Tools**:
  - Application Builder: Access included.
  - Role Search: Access included.
  - Interview Prep: **LOCKED**.

### Student Premium (Learn+)
**Price:** $7/month
- **Pod Access**: Unlimited.
- **AI Assistant**: **Unlimited Chats**.
- **Personal AI Resources**: **Unlimited** Flashcards, Quizzes, Notes.
- **Phoenix AI**: Priority access.
- **Career Tools**:
  - Application Builder: Access included.
  - Role Search: Access included.
  - Interview Prep: **Full Access** to AI Interview Simulator.

---

## 👩‍🏫 Teacher Tiers

### Teacher Free
**Price:** $0/month
- **Pod Creation**: Limited to **1 Pod**.
- **Quiz Creation**: Limited to **2 Quizzes**.
- **Nexus AI**: **NO ACCESS** (View-only Upgrade Overlay).
- **Core Tools**: Full access to Whiteboards, Materials, Notes within the single pod.
- **Students**: Unlimited students in the single pod.

### Teacher Premium (Teach+)
**Price:** $7/month
- **Pod Creation**: **Unlimited Pods**.
- **Quiz Creation**: **Unlimited Quizzes**.
- **Nexus AI**: **Full Access** to all modules:
  - Curriculum Architect
  - Lesson Orchestrator
  - Assessment Hub (Auto-grading)
  - Progress Analytics
  - Time Optimizer
  - Global Resource Library
  - Student Profiles
- **Support**: Priority handling.

---

## 🔒 Technical Enforcement

### Database Limits (SQL)
- `check_pod_limit`: < 1 for Free Teachers.
- `check_quiz_limit`: < 2 for Free Teachers.
- `subscriptions` constraint: `tier IN ('free', 'premium', 'teacher_premium', 'student_premium')`.

### Frontend Entitlements
- **Nexus**: `isPremium` check blocks all tabs for Free Teachers.
- **Learnspace**: `check-subscription` check enforces 3-chat limit.
- **Resources**: `isPremium` check enforces 1-set limit per type.
- **Careers**: `isPremium` check enforces Interview Prep access.
