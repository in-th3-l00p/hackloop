# LoopHack

**Tagline:** "Launch your hackathon in 5 minutes, not 5 days"

## Project Overview

LoopHack is a real-time collaborative hackathon management platform designed to eliminate the complexity of organizing hackathons. Inspired by tools like Figma, it provides a live, shared environment where organizers, participants, judges, and mentors all work together seamlessly—no page refreshes, no juggling multiple tools, no lost submissions.

## The Problem

Current hackathon organization is painful:
- Organizers use 5+ tools: Google Forms, Sheets, email, Discord, Devpost
- Participants worry "did my submission go through?"
- Submissions get lost during deadline chaos
- No visibility into what's happening in real-time
- Setup takes days of coordination

## The Solution

LoopHack is a single platform where everything happens live:
- **For Organizers:** See registrations, submissions, and activity in real-time
- **For Participants:** Shared team workspace with auto-save and clear submission status
- **For Judges:** Clean scoring interface with live leaderboard updates
- **For Everyone:** One URL, one platform, zero confusion

## Core Philosophy

1. **Instant & Live:** Real-time updates everywhere, no refresh needed
2. **Radically Simple:** If it takes more than 3 clicks, it doesn't belong
3. **Zero Anxiety:** Crystal-clear status indicators, auto-saves, impossible to lose work
4. **Built for Chaos:** Designed for 100 students submitting in the last 60 seconds

## Key Features

### Event Creation
- Quick setup: name, date, duration, description
- Auto-generated unique event URL
- Configure categories, judging criteria, team size limits

### Live Dashboard (Organizer)
- Real-time statistics and activity feed
- Countdown timer visible to all
- Post announcements instantly
- Export data, control results visibility

### Team Registration & Workspace
- Magic link authentication (no passwords)
- Shared team workspace with live collaboration
- Auto-saving submission form
- Support for: project description, demo video, GitHub links, file uploads
- Clear submission status: Draft → Submitted ✓

### Help Desk
- Ticket system for participant questions
- Live status updates for organizers and requesters

### Judging System
- Judge portal with magic link access
- Score projects on custom criteria (0-10 scale)
- Add notes and feedback
- Track judging progress

### Results
- Aggregated scoring with leaderboard
- Admin-controlled visibility toggle
- Participant view of rankings and score breakdowns

## Technical Architecture

### Stack
- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS (light, relaxed colorscheme)
- **Real-time:** Supabase Realtime or WebSockets
- **Authentication:** Magic links (passwordless)

### Critical Requirements
- **Real-time synchronization** across all users and views
- **Auto-save** every 10 seconds to prevent data loss
- **File upload support** up to 500MB with progress indicators
- **Server-side deadline enforcement** to lock submissions
- **Rate limiting** to handle submission surges
- **Offline resilience** with reconnection states

## Target Audience

Primary: High school and college hackathon organizers
Secondary: Corporate hackathon coordinators, workshop facilitators

These users are tired of:
- Duct-taping together multiple platforms
- Technical failures during critical moments
- Complex setup processes
- Poor participant experience

## User Experience Goals

Opening LoopHack should feel like opening a fresh Figma file—clean, purposeful, and immediately understandable. Every interaction should feel alive and immediate.

### For Organizers
"I can see my hackathon coming to life in real-time"

### For Participants
"I know exactly where I stand and what I need to do"

### For Judges
"Scoring is straightforward and I can see my progress"

## Differentiators

**vs. Devpost:** Real-time collaboration, simpler setup, modern UX
**vs. Google Forms + Sheets:** All-in-one platform, live updates, purpose-built
**vs. Custom Solutions:** 5-minute setup vs. weeks of development

## Vision

Stop managing hackathons. Start experiencing them.

LoopHack handles the logistics so organizers can focus on creating amazing events and participants can focus on building great projects.

---

## Development Notes

### Must-Have for Launch
- Event creation and management
- Team registration and workspace
- Submission system with file uploads
- Judging portal with scoring
- Results dashboard
- Real-time sync across all features

### Future Enhancements
- Photo gallery for event moments
- Certificate generation
- Slack/Discord webhook integrations
- QR code check-in system
- Advanced analytics dashboard
- Template library for common hackathon formats

### Design Principles
- Light, relaxed color palette (soft pastels, muted tones)
- Generous whitespace
- Clear status indicators everywhere
- Minimal cognitive load
- Mobile-responsive by default

---

**Project Status:** Concept → Ready for Development
**Platform:** Web-based (with potential for PWA)
**License:** TBD