# User access and role setup

## Account access

Users register with their work email at `/signup` and sign in at `/login`. A regular account can submit and track its own claims. It cannot grant itself elevated roles.

## Assigning Finance or Approver

After the user confirms their email and signs in once, a Supabase project administrator can assign a role from the SQL editor. Replace the email and role in this statement:

```sql
insert into public.user_roles (user_id, role)
select id, 'finance'
from auth.users
where lower(email) = lower('finance@example.com')
on conflict (user_id, role) do nothing;
```

Use `approver` to assign approval access. Add both role rows to a person who performs both jobs. Remove a role with:

```sql
delete from public.user_roles
where user_id = (select id from auth.users where lower(email) = lower('finance@example.com'))
  and role = 'finance';
```

Only the Supabase project administrator can write `user_roles`. Finance can classify claims, release payments, and manage departments. Approvers can approve or reject classified claims. Both roles can see all claims; other signed-in users see only claims they submitted. Database functions enforce these roles even if a user bypasses the interface.

## Email confirmation redirects

Set the Supabase Auth Site URL to the production app URL and add these allowed redirect URLs:

```text
http://localhost:3000/auth/callback
https://claim-form-demo.vercel.app/auth/callback
```

Add any production custom domain used by the app as another allowed redirect URL.
