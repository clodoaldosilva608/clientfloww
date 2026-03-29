export type DashboardStats = {
  total_clients: number
  messages_by_status: {
    sent: number
    delivered: number
    read: number
    failed: number
    pending: number
  }
  campaigns_by_status: {
    draft: number
    running: number
    finished: number
    sent: number
    scheduled: number
  }
}
