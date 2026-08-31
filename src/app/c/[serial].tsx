/**
 * The certificate permalink. This is the sharing surface — the whole growth loop is
 * links, which is why the web target runs server output rather than a static export
 * (docs/02-architecture.md).
 */
import { Link, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Certificate } from '@/components/certificate/Certificate';
import { FormLabel, Lantern, PaperSurface, Rule, StampSeal, WallSurface } from '@/components/primitives';
import { getCertificateBySerial, toCertificateProps } from '@/lib/api/certificates';
import { OG, ogDescription, ogImageUrl, ogTitle, permalinkUrl } from '@/lib/certificate/og';
import { isSerial } from '@/lib/certificate/serial';
import { color, font, space } from '@/theme/tokens';

export default function CertificatePermalink() {
  const { serial: raw } = useLocalSearchParams<{ serial: string }>();
  const serial = (raw ?? '').toUpperCase();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['certificate', serial],
    queryFn: () => getCertificateBySerial(serial),
    enabled: isSerial(serial),
  });

  const props = data ? toCertificateProps(data) : null;

  // At prerender time `serial` is still the literal route segment, so these fall back
  // to the sentinels in lib/certificate/og.ts. api/c.ts substitutes the real values
  // per request — see the note there.
  const title =
    props && data
      ? ogTitle({ ...props, band: data.band, remark1: props.remark1, remark2: props.remark2 })
      : `${serial} — ElaRater`;
  const description =
    props && data
      ? ogDescription({ ...props, band: data.band, remark1: props.remark1, remark2: props.remark2 })
      : OG.description;

  return (
    <WallSurface>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={permalinkUrl(serial)} />
        <meta property="og:image" content={ogImageUrl(serial, 'og')} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl(serial, 'og')} />
      </Head>

      <ScrollView contentContainerStyle={{ padding: wide ? space.xl : space.md, gap: space.lg }}>
        <Link href="/" style={{ alignSelf: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Lantern size={14} tone="officeLight" />
            <FormLabel size={11} tracking={2.4} tone="wallTextDim">
              ELARATER
            </FormLabel>
          </View>
        </Link>

        <View style={{ maxWidth: 1000, width: '100%', alignSelf: 'center', gap: space.md }}>
          {isLoading ? (
            <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxl }}>
              {/* Loading is the seal turning slowly. Never a spinner. */}
              <StampSeal size={92} animate="spin" opacity={0.5} />
              <FormLabel size={11} tone="wallTextDim">
                RETRIEVING THE RECORD
              </FormLabel>
              <ActivityIndicator style={{ opacity: 0 }} />
            </View>
          ) : null}

          {!isLoading && (isError || !props) ? (
            <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxl }}>
              <StampSeal size={92} tone="stamp" opacity={0.6} />
              <FormLabel size={12} tracking={2.6} tone="wallTextDim">
                NO INSPECTION ON RECORD
              </FormLabel>
              <Text style={{ fontFamily: font.typed, fontSize: 14, color: color.wallTextDim }}>
                {isSerial(serial) ? serial : `${serial || 'That'} is not a serial number.`}
              </Text>
            </View>
          ) : null}

          {props ? (
            <>
              <PaperSurface padding="xs" guilloche={false}>
                <Certificate {...props} />
              </PaperSurface>

              <Rule tone="brass" opacity={0.4} />

              <View style={{ gap: space.sm }}>
                <FormLabel size={11} tracking={2.2} tone="wallTextDim">
                  {`INSPECTED BY ${(data?.author_display_name ?? data?.author_handle ?? 'AN ANONYMOUS INSPECTOR').toUpperCase()}`}
                </FormLabel>
                <FormLabel size={11} tracking={2.2} tone="wallTextDim">
                  {`${data?.building_name ?? ''} · ${data?.city ?? ''}`.toUpperCase()}
                </FormLabel>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </WallSurface>
  );
}
