/**
 * @typedef {'red' | 'white' | 'birthday' | 'other'} OccasionType
 */

/**
 * @typedef {Object} LedgerRecord
 * @property {string} id
 * @property {number} amount
 * @property {string} name
 * @property {string} date
 * @property {string} occasion
 * @property {OccasionType} occasionType
 * @property {'returned' | 'pending'} status
 * @property {'received'} type - 只支持收礼
 * @property {string} [address] - 地址（可选）
 */

/**
 * @typedef {Object} PersonSummary
 * @property {string} name
 * @property {number} totalReceived
 * @property {number} pendingAmount
 */

export {}
