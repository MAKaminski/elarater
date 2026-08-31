import Head from 'expo-router/head';
import { LegalPage } from '@/components/LegalPage';

/**
 * Both stores need a hosted privacy policy URL before submission, and it must match
 * the iOS privacy manifest and the Play Data Safety form exactly — mismatches get
 * caught and are painful to unwind (docs/06-store-compliance.md).
 */
export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — ElaRater</title>
        <meta name="description" content="What ElaRater collects, why, and how to delete it." />
      </Head>
      <LegalPage
        title="Privacy Policy"
        updated="2026-08-31"
        sections={[
          {
            heading: 'WHAT WE COLLECT',
            body: [
              'Account: your email address, a handle, and an optional display name.',
              'Inspections: the four sub-scores you tap, your remarks, the elevator and building you rated, and the date.',
              'Approximate location: only while the app is open and only when you ask it to find elevators near you. We request coarse location and never background location.',
              'Photos: only ones you choose to attach to an inspection.',
              'Diagnostics: crash and error reports, which do not include your remarks.',
            ],
          },
          {
            heading: 'WHY',
            body: [
              'Location finds the building you are standing in. It is used at the moment you ask and is not stored as a location history.',
              'Inspections and remarks are published as certificates. Treat anything you type as public.',
              'Your email is used to sign you in and for service messages. It is never shown to other users and never sold.',
            ],
          },
          {
            heading: 'WHO ELSE SEES IT',
            body: [
              'Our hosting and database providers, Vercel and Supabase, process this data on our behalf.',
              'We do not sell personal data and we do not run third-party advertising trackers.',
            ],
          },
          {
            heading: 'DELETING YOUR DATA',
            body: [
              'In the app: Settings, then Account, then Delete account.',
              'On the web: elarater.vercel.app/delete-account.',
              'Your profile is removed immediately and purged after 30 days. Your inspections stay on record but stop being attributed to you, so each elevator keeps its score history while your authorship does not.',
            ],
          },
          {
            heading: 'CONTACT',
            body: ['support@elarater.app. We answer reports within 24 hours.'],
          },
        ]}
      />
    </>
  );
}
