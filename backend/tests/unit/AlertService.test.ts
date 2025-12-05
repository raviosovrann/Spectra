import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { AlertService } from '../../src/services/AlertService.js'
import pool from '../../src/database/config.js'

// Mock the database pool
vi.mock('../../src/database/config.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

const mockQueryResult = <T>(rows: T[]) => ({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] })

interface TestAlert {
  alert_id: string
  user_id: string
  symbol: string
  alert_type: string
  condition: Record<string, unknown>
  status: string
}

describe('AlertService', () => {
  let alertService: AlertService

  beforeEach(() => {
    vi.clearAllMocks()
    alertService = new AlertService()
    vi.clearAllMocks() // Clear the constructor's call to pool.query
  })

  it('should load active alerts', async () => {
    const mockAlerts: TestAlert[] = [
      {
        alert_id: '1',
        user_id: 'user1',
        symbol: 'BTC-USD',
        alert_type: 'price',
        condition: { target: 50000, direction: 'above' },
        status: 'active',
      },
    ];

    (pool.query as Mock).mockResolvedValueOnce(mockQueryResult(mockAlerts))

    await alertService.loadActiveAlerts()

    // Access private property for testing
    const activeAlerts = (alertService as unknown as { activeAlerts: Map<string, TestAlert[]> }).activeAlerts
    expect(activeAlerts.get('BTC-USD')).toHaveLength(1)
    expect(activeAlerts.get('BTC-USD')?.[0].alert_id).toBe('1')
  })

  it('should trigger alert when price is above target', async () => {
    const mockAlerts: TestAlert[] = [
      {
        alert_id: '1',
        user_id: 'user1',
        symbol: 'BTC-USD',
        alert_type: 'price',
        condition: { target: 50000, direction: 'above' },
        status: 'active',
      },
    ];

    (pool.query as Mock).mockResolvedValueOnce(mockQueryResult(mockAlerts))
    await alertService.loadActiveAlerts();

    // Mock update query for triggering
    (pool.query as Mock).mockResolvedValueOnce(mockQueryResult([]))

    await alertService.checkAlerts('BTC-USD', 50001)

    expect(pool.query).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE spectra_user_alerts_t'),
      ['1']
    )
  })

  it('should NOT trigger alert when price is below target (for above condition)', async () => {
    const mockAlerts: TestAlert[] = [
      {
        alert_id: '1',
        user_id: 'user1',
        symbol: 'BTC-USD',
        alert_type: 'price',
        condition: { target: 50000, direction: 'above' },
        status: 'active',
      },
    ];

    (pool.query as Mock).mockResolvedValueOnce(mockQueryResult(mockAlerts))
    await alertService.loadActiveAlerts()

    await alertService.checkAlerts('BTC-USD', 49999)

    // Should not issue an UPDATE when condition not met
    const updateCalls = (pool.query as Mock).mock.calls.filter((call) =>
      typeof call[0] === 'string' && (call[0] as string).includes('UPDATE spectra_user_alerts_t')
    )
    expect(updateCalls.length).toBe(0)
  })

  it('should trigger alert when price is below target', async () => {
    const mockAlerts: TestAlert[] = [
      {
        alert_id: '2',
        user_id: 'user1',
        symbol: 'ETH-USD',
        alert_type: 'price',
        condition: { target: 3000, direction: 'below' },
        status: 'active',
      },
    ];

    (pool.query as Mock).mockResolvedValueOnce(mockQueryResult(mockAlerts))
    await alertService.loadActiveAlerts();

    // Mock update query for triggering
    (pool.query as Mock).mockResolvedValueOnce(mockQueryResult([]))

    await alertService.checkAlerts('ETH-USD', 2999)

    expect(pool.query).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE spectra_user_alerts_t'),
      ['2']
    )
  })
})