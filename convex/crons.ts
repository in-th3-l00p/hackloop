import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Check for events that need to be auto-completed every minute
crons.interval(
  "check-event-deadlines",
  { minutes: 1 },
  internal.events.checkAndCompleteEvents
)

export default crons
