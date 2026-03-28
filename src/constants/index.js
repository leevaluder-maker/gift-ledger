/**
 * @typedef {Object} OccasionCategory
 * @property {import('../types').OccasionType} type
 * @property {string} label
 * @property {string[]} items
 * @property {string} color
 */

/** @type {OccasionCategory[]} */
export const OCCASION_CATEGORIES = [
  {
    type: 'red',
    label: '红喜事',
    items: [
      '我结婚',
      '儿子结婚',
      '女儿结婚',
      '孙子结婚',
      '孙女结婚',
      '外孙结婚',
      '外孙女结婚',
      '儿子满月',
      '女儿满月',
      '乔迁之喜',
      '升学',
    ],
    color: '#990f19',
  },
  {
    type: 'white',
    label: '白喜事',
    items: [
      '爸爸丧事',
      '妈妈丧事',
      '爷爷丧事',
      '奶奶丧事',
      '外公丧事',
      '外婆丧事',
      '配偶丧事',
    ],
    color: '#5a403e',
  },
  {
    type: 'birthday',
    label: '祝寿',
    items: ['六十大寿', '七十大寿', '八十大寿', '九十大寿', '百岁寿辰'],
    color: '#5a403e',
  },
  {
    type: 'other',
    label: '其它',
    items: [],
    color: '#5a403e',
  },
]
