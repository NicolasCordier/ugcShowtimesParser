#####
# Category and channels
#####

resource "discord_category_channel" "ugc_culte" {
  name = "--- 🎬UGC Culte🎬 ---"
  server_id = var.discord_server_id
}

resource "discord_text_channel" "cinemas" {
  for_each  = local.cinemas

  server_id = var.discord_server_id
  category  = discord_category_channel.ugc_culte.id
  name      = each.value.nickname
  position  = each.value.position
  topic     = "${each.value.name} - ${each.value.address}, ${each.value.zip} ${each.value.city}"

  lifecycle {
    ignore_changes = [
      sync_perms_with_category,
    ]
  }
}

resource "discord_text_channel" "debug" {
  server_id = var.discord_server_id
  category  = discord_category_channel.ugc_culte.id
  name      = "debug"
  position  = 1

  lifecycle {
    ignore_changes = [
      sync_perms_with_category,
    ]
  }
}

resource "discord_text_channel" "index" {
  server_id = var.discord_server_id
  category  = discord_category_channel.ugc_culte.id
  name      = "index"
  position  = 2

  lifecycle {
    ignore_changes = [
      sync_perms_with_category,
    ]
  }
}

resource "discord_message" "hash" {
  channel_id = discord_text_channel.debug.id
  content    = "{}"

  lifecycle {
    ignore_changes = [
      content, # The content is dynamically updated by the lambda. We shouldn't override it when redeploying
    ]
  }
}

resource "discord_message" "index" {
  for_each   = discord_text_channel.cinemas

  channel_id = discord_text_channel.index.id
  content    = "- ${local.cinemas[each.key].name} - ${local.cinemas[each.key].address}, ${local.cinemas[each.key].zip} ${local.cinemas[each.key].city} <#${each.value.id}>"
  # content    = join("\n", [for id, channel in discord_text_channel.cinemas : "- ${local.cinemas[id].name} - ${local.cinemas[id].zip} ${local.cinemas[id].city} <#${channel.id}>"])
}

#####
# Permissions
#####

data "discord_role" "bot" {
  server_id = var.discord_server_id
  name      = "UGC"
}

data "discord_permission" "bot" {
  view_channel         = "allow"
  read_message_history = "allow"
  send_messages        = "allow"
}

resource "discord_channel_permission" "bot_channels" {
  for_each     = discord_text_channel.cinemas

  channel_id   = each.value.id
  type         = "role"
  overwrite_id = data.discord_role.bot.id
  allow        = data.discord_permission.bot.allow_bits
  deny         = data.discord_permission.bot.deny_bits
}

resource "discord_channel_permission" "bot_debug" {
  channel_id   = discord_text_channel.debug.id
  type         = "role"
  overwrite_id = data.discord_role.bot.id
  allow        = data.discord_permission.bot.allow_bits
  deny         = data.discord_permission.bot.deny_bits
}

resource "discord_channel_permission" "bot_index" {
  channel_id   = discord_text_channel.index.id
  type         = "role"
  overwrite_id = data.discord_role.bot.id
  allow        = data.discord_permission.bot.allow_bits
  deny         = data.discord_permission.bot.deny_bits
}

data "discord_role" "everyone" {
  server_id = var.discord_server_id
  name      = "@everyone"
}

data "discord_permission" "read_only" {
  view_channel          = "allow"
  read_message_history  = "allow"
  create_instant_invite = "deny"
  add_reactions         = "deny"
  send_messages         = "deny"
  attach_files          = "deny"
  mention_everyone      = "deny"
  use_external_emojis   = "deny"
}

data "discord_permission" "deny_all" {
  view_channel          = "deny"
  read_message_history  = "deny"
  create_instant_invite = "deny"
  add_reactions         = "deny"
  send_messages         = "deny"
  attach_files          = "deny"
  mention_everyone      = "deny"
  use_external_emojis   = "deny"
}

resource "discord_channel_permission" "everyone_channels" {
  for_each     = discord_text_channel.cinemas

  channel_id   = each.value.id
  type         = "role"
  overwrite_id = data.discord_role.everyone.id
  allow        = data.discord_permission.read_only.allow_bits
  deny         = data.discord_permission.read_only.deny_bits

  # We need to add permissions to bot before removing to everyone to avoid soft lock
  depends_on = [discord_channel_permission.bot_channels]
}

resource "discord_channel_permission" "everyone_debug" {
  channel_id   = discord_text_channel.debug.id
  type         = "role"
  overwrite_id = data.discord_role.everyone.id
  allow        = data.discord_permission.deny_all.allow_bits
  deny         = data.discord_permission.deny_all.deny_bits

  # We need to add permissions to bot before removing to everyone to avoid soft lock
  depends_on = [discord_channel_permission.bot_debug]
}

resource "discord_channel_permission" "everyone_index" {
  channel_id   = discord_text_channel.index.id
  type         = "role"
  overwrite_id = data.discord_role.everyone.id
  allow        = data.discord_permission.read_only.allow_bits
  deny         = data.discord_permission.read_only.deny_bits

  # We need to add permissions to bot before removing to everyone to avoid soft lock
  depends_on = [discord_channel_permission.bot_index]
}