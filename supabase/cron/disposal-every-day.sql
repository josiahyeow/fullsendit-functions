select
  cron.schedule(
    'disposal-every-day',
    '0 0 * * *',
    $$
    select status
    from
      http((
        'POST',
        'https://rewowctthtbtuxffukum.functions.supabase.co/disposal',
        ARRAY[http_header('Authorization', 'Bearer token')],
        'application/json',
        '{}'
      )::http_request)
    $$
  );