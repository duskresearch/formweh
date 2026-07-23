import type { Field } from './db'

// The ready-made forms shown in the "start from a template" flow. Each is just a
// starting set of fields and copy the user can then tweak in the builder. The
// waitlist template flips on the referral loop.

export type Template = {
  id: string
  name: string
  kind: 'form' | 'waitlist' | 'survey'
  blurb: string
  intro_title: string
  intro_desc: string
  success_message: string
  referral?: boolean
  fields: Field[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'contact',
    name: 'Contact form',
    kind: 'form',
    blurb: 'Name, email, and a message. The everyday one.',
    intro_title: 'Get in touch',
    intro_desc: 'Send us a message and we’ll get back to you.',
    success_message: 'Thanks, we got your message and will reply soon.',
    fields: [
      { key: 'name', label: 'Your name', type: 'short', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'message', label: 'Message', type: 'long', required: true },
    ],
  },
  {
    id: 'waitlist',
    name: 'Waitlist + referrals',
    kind: 'waitlist',
    blurb: 'Collect emails pre-launch, with a skip-the-line referral loop.',
    intro_title: 'Join the waitlist',
    intro_desc: 'Be the first in when we open the doors.',
    success_message: 'You’re on the list.',
    referral: true,
    fields: [
      { key: 'name', label: 'Your name', type: 'short', required: false },
      { key: 'email', label: 'Email', type: 'email', required: true },
    ],
  },
  {
    id: 'survey',
    name: 'Survey',
    kind: 'survey',
    blurb: 'A few questions with choices and a comment box.',
    intro_title: 'Quick survey',
    intro_desc: 'Two minutes, and it genuinely helps.',
    success_message: 'Thanks for taking the survey.',
    fields: [
      { key: 'email', label: 'Email (optional)', type: 'email', required: false },
      { key: 'rating', label: 'How likely are you to recommend us?', type: 'choice', required: true, options: ['Very likely', 'Likely', 'Neutral', 'Unlikely', 'Very unlikely'] },
      { key: 'liked', label: 'What did you like most?', type: 'checkboxes', required: false, options: ['Design', 'Speed', 'Price', 'Support', 'Features'] },
      { key: 'comments', label: 'Anything else?', type: 'long', required: false },
    ],
  },
  {
    id: 'rsvp',
    name: 'RSVP',
    kind: 'form',
    blurb: 'Who’s coming, plus a guest count.',
    intro_title: 'RSVP',
    intro_desc: 'Let us know if you can make it.',
    success_message: 'Thanks, your RSVP is in.',
    fields: [
      { key: 'name', label: 'Your name', type: 'short', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'attending', label: 'Will you be there?', type: 'choice', required: true, options: ['Yes, I’ll be there', 'No, can’t make it'] },
      { key: 'guests', label: 'How many guests?', type: 'number', required: false },
    ],
  },
  {
    id: 'coming-soon',
    name: 'Coming soon',
    kind: 'waitlist',
    blurb: 'A minimal "notify me" for a landing page.',
    intro_title: 'Coming soon',
    intro_desc: 'Leave your email and we’ll tell you the moment it’s live.',
    success_message: 'We’ll be in touch.',
    fields: [{ key: 'email', label: 'Email', type: 'email', required: true }],
  },
  {
    id: 'feedback',
    name: 'Feedback',
    kind: 'form',
    blurb: 'Let people tell you what’s working and what isn’t.',
    intro_title: 'Send feedback',
    intro_desc: 'Bugs, ideas, gripes, all welcome.',
    success_message: 'Thanks, noted.',
    fields: [
      { key: 'type', label: 'What kind?', type: 'choice', required: true, options: ['Bug', 'Idea', 'Praise', 'Other'] },
      { key: 'message', label: 'Tell us more', type: 'long', required: true },
      { key: 'email', label: 'Email (optional)', type: 'email', required: false },
    ],
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
