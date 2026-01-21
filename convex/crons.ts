import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "check-event-deadlines",
  { minutes: 1 },
  internal.events.checkAndCompleteEvents
)

export default crons
