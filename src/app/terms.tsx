import Head from 'expo-router/head';
import { LegalPage } from '@/components/LegalPage';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Use — ElaRater</title>
        <meta name="description" content="The rules for filing inspections on ElaRater." />
      </Head>
      <LegalPage
        title="Terms of Use"
        updated="2026-08-31"
        sections={[
          {
            heading: 'WHAT THIS IS',
            body: [
              'ElaRater is a parody. The "Office of Ride Quality" is not a real agency, certificates carry no legal weight, and nothing here is a safety assessment.',
              'If an elevator seems genuinely unsafe, tell the building, not us.',
            ],
          },
          {
            heading: 'YOUR CONTENT',
            body: [
              'You keep ownership of your inspections and remarks. You grant us a licence to display them in the app, on certificate permalinks, and in link previews.',
              'Inspect elevators you have actually ridden. Invented findings are removed.',
            ],
          },
          {
            heading: 'WHAT IS NOT ALLOWED',
            body: [
              'Nothing harassing, hateful, sexually explicit, or abusive, in remarks or photos.',
              'No personal information about anyone, including building staff.',
              'No spam, advertising, links, or contact details in remarks.',
              'No automated rating, vote manipulation, or score farming.',
            ],
          },
          {
            heading: 'MODERATION',
            body: [
              'Remarks are screened before they are published. Anyone can report content from the certificate it appears on, and you can block another inspector at any time — blocked accounts disappear from your feed in both directions.',
              'We review reports within 24 hours. Accounts that break these rules are suspended.',
            ],
          },
          {
            heading: 'ENDING YOUR ACCOUNT',
            body: [
              'Delete it any time in Settings, or at elarater.vercel.app/delete-account. We may suspend accounts that break these rules.',
            ],
          },
          { heading: 'CONTACT', body: ['support@elarater.app.'] },
        ]}
      />
    </>
  );
}
