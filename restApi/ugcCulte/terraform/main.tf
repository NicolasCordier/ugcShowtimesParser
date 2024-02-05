resource "scaleway_function" "main" {
  name         = "ugc-culte-reporter"
  namespace_id = var.scw_namespace_id
  runtime      = "node20"
  handler      = "index.handle"
  privacy      = "private"
  timeout      = 60
  zip_file     = local.lambda_zip_path
  zip_hash     = filesha256(local.lambda_zip_path)
  deploy       = true
  min_scale    = 0
  max_scale    = 1
  memory_limit = 128
  

  environment_variables = {
    "DISCORD_CINEMAS_CHANNELS" = jsonencode({for id, channel in discord_text_channel.cinemas : id => channel.id})
    "DISCORD_CACHE_CHANNEL_ID" = discord_text_channel.debug.id
    "DISCORD_CACHE_MESSAGE_ID" = discord_message.hash.id
  }

  secret_environment_variables = {
    "DISCORD_TOKEN" = var.discord_token
  }
}

resource "scaleway_function_cron" "main" {
  name = "everydate-at-20h"
  function_id = scaleway_function.main.id
  schedule = "0 19 * * *"
  args = "{}"
}