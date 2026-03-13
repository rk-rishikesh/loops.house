-- Allow anyone to create hackathons
drop policy if exists "hackathons_insert_event_creator" on public.hackathons;

create policy "hackathons_insert_authenticated"
  on public.hackathons for insert with check (
    auth.uid() = host_id
  );
