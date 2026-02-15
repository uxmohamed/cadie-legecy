-- Ensure PostgREST sees freshly added columns (e.g. links.content_text) immediately.
NOTIFY pgrst, 'reload schema';
