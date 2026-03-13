alter table public.links
  add column if not exists processing_state text not null default 'completed',
  add column if not exists processing_stage text,
  add column if not exists processing_error text;

update public.links
set
  processing_state = case
    when content_type in ('url', 'image', 'document') and fetch_status = 'failed' then 'failed'
    when content_type = 'url' and (fetch_status in ('pending', 'fetching') or coalesce(array_length(ai_tags, 1), 0) = 0) then 'processing'
    when content_type in ('image', 'document') and coalesce(array_length(ai_tags, 1), 0) = 0 then 'processing'
    else 'completed'
  end,
  processing_stage = case
    when content_type in ('url', 'image', 'document') and fetch_status = 'failed' then 'metadata'
    when content_type = 'url' and (fetch_status in ('pending', 'fetching') or coalesce(array_length(ai_tags, 1), 0) = 0) then 'metadata'
    when content_type = 'image' and coalesce(array_length(ai_tags, 1), 0) = 0 then 'ai_vision_tagging'
    when content_type = 'document' and coalesce(array_length(ai_tags, 1), 0) = 0 then 'ai_tagging'
    else 'complete'
  end
where true;
