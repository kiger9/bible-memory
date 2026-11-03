/** Prebuilt study plans: named lists of passages a person can add in one go, in any translation. */
export interface StudyPlan {
  id: string
  name: string
  description: string
  /** References in the form the parser accepts, e.g. "Colossians 3:1-4" or "2 Timothy 3:16-4:5". */
  passages: string[]
}

export const PLANS: StudyPlan[] = [
  {
    id: 'upadhye-2026',
    name: 'Upadhye 2026',
    description: 'Twelve passages from the epistles for the year: holding fast, living out the faith, and handling the word rightly.',
    passages: [
      'Colossians 3:1-4',
      'Philemon 1:15-16',
      'Jude 1:3-4',
      '1 Peter 2:21-25',
      '2 Peter 3:17-18',
      'James 1:25-27',
      '1 John 4:1-11',
      '2 John 1:8-11',
      '3 John 1:5-8',
      '1 Timothy 4:6-11',
      '2 Timothy 3:16-4:5',
      'Titus 3:11-15',
    ],
  },
]

export function getPlan(id: string): StudyPlan | undefined { return PLANS.find(p => p.id === id) }
