-- The service role backs the Edge Functions: moderate-remarks screens ratings before
-- they become publicly readable, and delete-account anonymises a departing user's
-- record. Without these grants moderation fails closed and nothing a user writes ever
-- becomes visible.
--
-- Stated explicitly rather than relying on default privileges, so every privilege
-- decision sits alongside 0013's two deliberate omissions: no client writes to
-- certificates, and no access at all to metro_sequences.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
