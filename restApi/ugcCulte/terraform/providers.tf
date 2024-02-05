terraform {
  required_providers {
    scaleway = {
      source = "scaleway/scaleway"
      version = "2.36.0"
    }
    discord = {
      source = "aequasi/discord"
      version = "0.0.4"
    }
  }
}

provider "scaleway" {
  access_key = var.scw_access_key
  secret_key = var.scw_secret_key
  region     = var.scw_region
  zone       = var.scw_zone
  project_id = var.scw_project_id
}

provider "discord" {
  token = var.discord_token
}